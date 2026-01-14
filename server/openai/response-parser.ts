/**
 * Parses and validates OpenAI model output into AIResponse (multi-bubble format).
 *
 * Responsibilities:
 * - Converts raw OpenAI completions into structured AIResponse objects.
 * - Enforces schema contract (see schema.ts) for all message types.
 * - Handles malformed, partial, or unexpected model output robustly.
 *
 * Constraints & Edge Cases:
 * - All schema changes must be coordinated with schema.ts and response-generator.ts.
 * - Throws or returns error objects on parse/validation failure.
 * - Used by both streaming and non-streaming OpenAI handlers.
 */
import { parse } from "best-effort-json-parser";
import { AIResponseSchema, type AIResponse } from "../ai-response-schema";
import { handleParseError, attemptResponseSalvage } from "./error-handler";
import { storage } from "../storage";

/**
 * OpenAI response parser and streaming content handler.
 *
 * Responsibilities:
 * - Parses and validates accumulated OpenAI model output (JSON or streaming) into AIResponse objects.
 * - Uses best-effort parsing and normalization, with fallback and salvage logic for malformed/partial output.
 * - Integrates with error-handler for fallback and salvage, and logs parse results for observability.
 *
 * Constraints & Edge Cases:
 * - Streaming chat endpoints expect multi-bubble framing; any format change requires coordinated client/server updates.
 * - Malformed or partial output triggers salvage or fallback logic.
 * - All DTOs/types must match shared and server/ai-response-schema.ts contracts.
 */

/**
 * Parses accumulated OpenAI response content into a validated AIResponse.
 * Normalizes messageType variants and validates against schema.
 * Falls back to error handler on parse/validation failure.
 * @param accumulatedContent Raw model output (string)
 * @returns Validated AIResponse
 */
export function parseOpenAIResponse(accumulatedContent: string): AIResponse {
  try {
    const parsedResponse = JSON.parse(accumulatedContent);
    //console.log(`[OpenAI] Raw response: ${accumulatedContent}`);

    // Normalize messageType variants before validation
    const normalized = normalizeAIResponse(parsedResponse);

    // Validate against schema
    const validated = AIResponseSchema.parse(normalized);
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
      // Normalize early so streaming logic can reason on canonical types
      const bubbles = normalizeBubbles(parseResult.bubbles);
      return {
        success: true,
        bubbles
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
          const hasMenuBubble = validated.bubbles.some(
            (bubble) => bubble.messageType === "menu" || bubble.messageType === "multiselect_menu"
          );
          if (!hasMenuBubble) {
            console.error(`[SURVEY MENU ERROR] Survey Q${currentQuestionIndex + 1} has ${currentQuestion.options.length} options but NO choice bubble (menu/multiselect_menu) generated!`);
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

// --- Helpers: normalize messageType variants from model ---
function normalizeType(type: any): string {
  if (!type || typeof type !== 'string') return type;
  const t = type.trim();
  // Common variants → canonical
  const map: Record<string, string> = {
    multiSelect_menu: 'multiselect_menu',
    multiselectMenu: 'multiselect_menu',
    multi_select_menu: 'multiselect_menu',
    MultiSelect_Menu: 'multiselect_menu',
    quickreplies: 'quickReplies',
    quick_replies: 'quickReplies',
    QuickReplies: 'quickReplies',
    formSubmission: 'form_submission',
    formsubmission: 'form_submission',
    form_submission: 'form_submission', // already canonical
  };
  if (map[t] ) return map[t];
  // Lowercased fallbacks
  const lower = t.toLowerCase();
  if (lower === 'multiselect_menu' || lower === 'multiselectmenu') return 'multiselect_menu';
  if (lower === 'quickreplies' || lower === 'quick_replies') return 'quickReplies';
  if (lower === 'formsubmission' || lower === 'form-submission') return 'form_submission';
  return t;
}

function normalizeBubble(b: any): any {
  if (!b || typeof b !== 'object') return b;
  const messageType = normalizeType(b.messageType);
  return { ...b, messageType };
}

function normalizeBubbles(bubbles: any[]): any[] {
  return bubbles.map(normalizeBubble);
}

function normalizeAIResponse(resp: any): any {
  if (!resp || typeof resp !== 'object') return resp;
  if (!Array.isArray(resp.bubbles)) return resp;
  return { ...resp, bubbles: normalizeBubbles(resp.bubbles) };
}
