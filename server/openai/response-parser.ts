import { parse } from "best-effort-json-parser";
import { AIResponseSchema, type AIResponse } from "../ai-response-schema";
import { handleParseError, attemptResponseSalvage } from "./error-handler";
import { storage } from "../storage";

/**
 * Parse accumulated OpenAI response content into validated AIResponse
 */
export function parseOpenAIResponse(accumulatedContent: string): AIResponse {
  try {
    const parsedResponse = JSON.parse(accumulatedContent);
    console.log(`[OpenAI] Raw response: ${accumulatedContent}`);

    // Validate against schema
    const validated = AIResponseSchema.parse(parsedResponse);
    console.log(
      `[OpenAI] Successfully generated ${validated.bubbles.length} message bubbles`,
    );

    return validated;
  } catch (parseError) {
    return handleParseError(parseError, accumulatedContent, "response parsing");
  }
}

/**
 * Parse streaming content using best-effort parser
 */
export function parseStreamingContent(accumulatedContent: string): {
  success: boolean;
  bubbles?: any[];
  error?: any;
} {
  try {
    const parseResult = parse(accumulatedContent);
    
    if (parseResult.bubbles && Array.isArray(parseResult.bubbles)) {
      return {
        success: true,
        bubbles: parseResult.bubbles
      };
    }
    
    return { success: false };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Validate if a bubble is complete and ready for streaming
 */
export function isBubbleComplete(bubble: any): boolean {
  if (!bubble.messageType || bubble.content === undefined) {
    return false;
  }

  // Type-specific validation
  switch (bubble.messageType) {
    case "menu":
      return !!(
        bubble.metadata?.options &&
        Array.isArray(bubble.metadata.options) &&
        bubble.metadata.options.length > 0 &&
        bubble.metadata.options.every((opt: any) => opt.id && opt.text && opt.action)
      );
      
    case "multiselect_menu":
      return !!(
        bubble.metadata?.options &&
        Array.isArray(bubble.metadata.options) &&
        bubble.metadata.options.length > 0 &&
        bubble.metadata.options.every((opt: any) => opt.id && opt.text && opt.action) &&
        bubble.metadata.allowMultiple !== undefined &&
        typeof bubble.metadata.minSelections === 'number' &&
        typeof bubble.metadata.maxSelections === 'number'
      );
      
    case "form":
      return !!(
        bubble.metadata?.formFields &&
        Array.isArray(bubble.metadata.formFields) &&
        bubble.metadata.formFields.length > 0 &&
        bubble.metadata.formFields.every((field: any) => field && field.id && field.label && field.type)
      );
      
    case "text":
      return !!(bubble.content && bubble.content.trim().length > 0);
      
    case "card":
      // For cards with buttons, ensure they're complete
      if (bubble.metadata?.buttons && Array.isArray(bubble.metadata.buttons)) {
        return bubble.metadata.buttons.every((btn: any) => btn.id && btn.text && btn.action);
      }
      return true; // Card without buttons is complete
      
    default:
      return true; // Other types (image, quickReplies) just need basic fields
  }
}

/**
 * Validate survey menu requirements
 */
export async function validateSurveyMenuRequirements(
  sessionId: string,
  validated: AIResponse
): Promise<void> {
  try {
    const surveySession = await storage.getSurveySessionBySessionId(sessionId);
    if (surveySession && surveySession.status === 'active') {
      const survey = await storage.getSurvey(surveySession.surveyId);
      if (survey) {
        const currentQuestionIndex = surveySession.currentQuestionIndex || 0;
        const questions = (survey.surveyConfig as any)?.questions;
        const currentQuestion = questions?.[currentQuestionIndex];
        
        if (currentQuestion?.options?.length > 0) {
          const hasMenuBubble = validated.bubbles.some(bubble => bubble.messageType === "menu");
          if (!hasMenuBubble) {
            console.error(`[SURVEY MENU ERROR] Survey Q${currentQuestionIndex + 1} has ${currentQuestion.options.length} options but NO menu bubble generated!`);
            console.error(`[SURVEY MENU ERROR] Generated ${validated.bubbles.length} bubbles:`, 
              validated.bubbles.map(b => `${b.messageType}: "${b.content?.substring(0, 50)}..."`));
          } else {
            console.log(`[SURVEY MENU SUCCESS] Survey Q${currentQuestionIndex + 1} correctly generated menu bubble`);
          }
        }
      }
    }
  } catch (error) {
    console.error("[SURVEY MENU VALIDATION] Error checking survey menu:", error);
  }
}

/**
 * Detect if JSON content appears to be ending/complete
 */
export function detectJsonBoundary(delta: string, accumulatedContent: string): boolean {
  // Check for bubble separators
  if (delta.includes("},{") || delta.includes("},\n{") || delta.includes("}, {")) {
    return true;
  }
  
  // Check for card completion patterns
  if (accumulatedContent.includes('"messageType":"card"') && 
      accumulatedContent.includes('"content":') &&
      (delta.includes('"}') || delta.includes('"}]') || delta.includes('"]}'))) {
    return true;
  }
  
  // Check for general message type completion
  if ((accumulatedContent.includes('"messageType":') && 
       accumulatedContent.includes('"content":')) &&
      (delta.includes('"}') || delta.includes('"}]') || delta.includes('"]}'))) {
    return true;
  }
  
  return false;
}