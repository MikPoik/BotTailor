import { getOpenAIClient, isOpenAIConfigured } from "./client";
import { MULTI_BUBBLE_RESPONSE_SCHEMA } from "./schema";
import { buildCompleteSystemPrompt } from "./context-builder";
import { buildSystemPrompt } from "../ai-response-schema";
import { 
  parseStreamingContent, 
  isBubbleComplete, 
  detectJsonBoundary,
  parseOpenAIResponse
} from "./response-parser";
import {
  validateSurveyMenuRequirements,
  type SurveyValidationResult
} from "./survey-menu-validator";
import {
  validateDynamicContent,
  type DynamicContentValidationResult
} from "./dynamic-content-validator";
import { handleCriticalError, generateFallbackResponse, attemptResponseSalvage } from "./error-handler";
import type { ConversationMessage } from "./response-generator";
import { storage } from "../storage";

export interface StreamingBubbleEvent {
  type: "bubble" | "complete";
  bubble?: any;
  content?: string;
  messageType?: string;
  metadata?: any;
}

/**
 * Build enhanced system prompt for dynamic content regeneration
 */
function buildDynamicRegenerationPrompt(
  originalSystemPrompt: string,
  dynamicValidation: DynamicContentValidationResult
): string {
  const { expectations, actualContent, errors, warnings, truncatedContent } = dynamicValidation;
  
  let enhancement = "\n\n🚨 DYNAMIC CONTENT VALIDATION REQUIREMENTS - MANDATORY COMPLIANCE:\n";
  
  // Add specific requirements based on expectations
  if (expectations) {
    if (expectations.expectedMenuOptions) {
      enhancement += `\n- MENU REQUIREMENT: You MUST generate ${expectations.expectedMenuOptions} menu options\n`;
      enhancement += `- Current: Found ${actualContent.menuOptions} menu options (expected ${expectations.expectedMenuOptions})\n`;
    }
    
    if (expectations.expectedQuickReplies) {
      enhancement += `\n- QUICK REPLIES REQUIREMENT: You MUST generate ${expectations.expectedQuickReplies} quick reply options\n`;
      enhancement += `- Current: Found ${actualContent.quickReplies} quick replies (expected ${expectations.expectedQuickReplies})\n`;
    }
    
    if (expectations.expectedInteractiveElements) {
      enhancement += `\n- INTERACTIVE ELEMENTS REQUIREMENT: You MUST generate ${expectations.expectedInteractiveElements} interactive elements\n`;
      enhancement += `- Current: Found ${actualContent.interactiveElements} interactive elements (expected ${expectations.expectedInteractiveElements})\n`;
    }
    
    if (expectations.contentIntent) {
      enhancement += `\n- CONTENT INTENT: "${expectations.contentIntent}" - ensure this intent is fully realized\n`;
    }
  }
  
  // Add specific error fixes
  if (errors.length > 0) {
    enhancement += `\nCRITICAL ERRORS TO FIX:\n${errors.map(err => `- ${err}`).join('\n')}\n`;
  }
  
  // Add truncation warnings
  if (truncatedContent) {
    enhancement += `\n⚠️  TRUNCATION DETECTED: Complete all interactive elements, don't leave content incomplete\n`;
  }
  
  // Add warnings
  if (warnings.length > 0) {
    enhancement += `\nWARNINGS TO ADDRESS:\n${warnings.map(warn => `- ${warn}`).join('\n')}\n`;
  }
  
  enhancement += `\n⚠️  DYNAMIC CONTENT REGENERATION - Your previous response had incomplete interactive elements. You MUST generate complete, functional interactive content.\n`;
  
  return originalSystemPrompt + enhancement;
}

/**
 * Regenerate response for dynamic content validation failures
 */
async function regenerateResponseWithDynamicValidation(
  userMessage: string,
  conversationHistory: any[],
  originalSystemPrompt: string,
  dynamicValidation: DynamicContentValidationResult,
  chatbotConfig: any
): Promise<any> {
  console.log(`[DYNAMIC REGENERATION] Starting regeneration for dynamic content validation failures`);
  
  try {
    const openai = getOpenAIClient();
    
    // Build enhanced system prompt with specific dynamic content requirements
    const enhancedSystemPrompt = buildDynamicRegenerationPrompt(originalSystemPrompt, dynamicValidation);
    
    console.log(`[DYNAMIC REGENERATION] Enhanced prompt length: ${enhancedSystemPrompt.length} chars`);
    console.log(`[DYNAMIC REGENERATION] Enhancement details:`, {
      expectations: dynamicValidation.expectations,
      actualContent: dynamicValidation.actualContent,
      errors: dynamicValidation.errors,
      truncated: dynamicValidation.truncatedContent
    });
    
    // Prepare messages with enhanced system prompt
    const messages = [
      { role: "system" as const, content: enhancedSystemPrompt },
      ...conversationHistory,
      { role: "user" as const, content: userMessage },
    ];
    
    // Extract configuration (same as original request)
    const model = chatbotConfig?.model || "gpt-4.1";
    const temperature = chatbotConfig?.temperature ? chatbotConfig.temperature / 10 : 0.7;
    const maxTokens = chatbotConfig?.maxTokens || 2000;
    
    console.log(`[DYNAMIC REGENERATION] Calling OpenAI API with model: ${model}`);
    
    // Make non-streaming regeneration call for faster processing
    const completion = await openai.chat.completions.create({
      model,
      messages,
      stream: false,
      response_format: {
        type: "json_schema",
        json_schema: MULTI_BUBBLE_RESPONSE_SCHEMA,
      },
      temperature,
      max_tokens: maxTokens,
    });
    
    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in dynamic regeneration response');
    }
    
    console.log(`[DYNAMIC REGENERATION] Received regenerated content (${content.length} chars)`);
    
    // Parse the regenerated response
    const regeneratedResponse = parseOpenAIResponse(content);
    
    console.log(`[DYNAMIC REGENERATION] Parsed ${regeneratedResponse.bubbles.length} bubbles from regenerated response`);
    
    return regeneratedResponse;
    
  } catch (error) {
    console.error(`[DYNAMIC REGENERATION] Regeneration failed:`, error);
    throw error;
  }
}

/**
 * Build enhanced system prompt for regeneration based on validation failures
 */
function buildRegenerationPrompt(
  originalSystemPrompt: string,
  validationResult: SurveyValidationResult
): string {
  const { validationMetadata, errors, detectedBubble } = validationResult;
  
  if (!validationMetadata) {
    return originalSystemPrompt + "\n\nIMPORTANT: The previous response had validation issues. Please ensure your response follows the exact JSON schema format.";
  }

  // Build specific enhancement based on expected message type
  let enhancement = "\n\n🚨 CRITICAL VALIDATION REQUIREMENTS - MANDATORY COMPLIANCE:\n";
  
  const { expectedMessageType, questionIndex, expectedOptionCount, expectedOptions } = validationMetadata;
  
  switch (expectedMessageType) {
    case 'menu':
      enhancement += `
- QUESTION ${questionIndex + 1} REQUIRES SINGLE-CHOICE MENU: You MUST generate a bubble with messageType: "menu"
- REQUIRED: ${expectedOptionCount} menu options in metadata.options array
- EACH OPTION MUST HAVE: {id: "unique_id", text: "option text", action: "send_message"}
`;
      if (expectedOptions) {
        enhancement += `- EXPECTED OPTION TEXTS: ${expectedOptions.map(o => `"${o.text}"`).join(', ')}
`;
      }
      break;
      
    case 'multiselect_menu':
      enhancement += `
- QUESTION ${questionIndex + 1} REQUIRES MULTIPLE-CHOICE MENU: You MUST generate a bubble with messageType: "multiselect_menu"
- REQUIRED: ${expectedOptionCount} menu options in metadata.options array
- REQUIRED: metadata.allowMultiple: true
- REQUIRED: metadata.minSelections and metadata.maxSelections (numbers)
- EACH OPTION MUST HAVE: {id: "unique_id", text: "option text", action: "send_message"}
`;
      if (expectedOptions) {
        enhancement += `- EXPECTED OPTION TEXTS: ${expectedOptions.map(o => `"${o.text}"`).join(', ')}
`;
      }
      break;
      
    case 'rating':
      enhancement += `
- QUESTION ${questionIndex + 1} REQUIRES RATING: You MUST generate a bubble with messageType: "rating"
- REQUIRED: metadata.minValue: ${validationMetadata.expectedMinValue || 1}
- REQUIRED: metadata.maxValue: ${validationMetadata.expectedMaxValue || 5}
- REQUIRED: metadata.ratingType: "${validationMetadata.expectedRatingType || 'stars'}"
`;
      if (validationMetadata.expectedStep) {
        enhancement += `- REQUIRED: metadata.step: ${validationMetadata.expectedStep}
`;
      }
      break;
  }
  
  // Add specific error details
  enhancement += `\nPREVIOUS ERRORS TO FIX:\n${errors.map(err => `- ${err}`).join('\n')}\n`;
  
  // Add detected bubble info if available
  if (detectedBubble) {
    enhancement += `\nDETECTED BUBBLE HAD: messageType "${detectedBubble.messageType}" (should be "${expectedMessageType}")\n`;
  }
  
  enhancement += `\n⚠️  REGENERATION ATTEMPT - Your previous response failed validation. You MUST fix these specific issues.\n`;
  
  return originalSystemPrompt + enhancement;
}

/**
 * Regenerate response using enhanced prompt with validation requirements
 */
async function regenerateResponseWithValidation(
  userMessage: string,
  conversationHistory: any[],
  originalSystemPrompt: string,
  validationResult: SurveyValidationResult,
  chatbotConfig: any
): Promise<any> {
  console.log(`[SURVEY REGENERATION] Starting regeneration for failed validation`);
  
  try {
    const openai = getOpenAIClient();
    
    // Build enhanced system prompt with specific validation requirements
    const enhancedSystemPrompt = buildRegenerationPrompt(originalSystemPrompt, validationResult);
    
    console.log(`[SURVEY REGENERATION] Enhanced prompt length: ${enhancedSystemPrompt.length} chars`);
    console.log(`[SURVEY REGENERATION] Enhancement details:`, {
      expectedType: validationResult.validationMetadata?.expectedMessageType,
      expectedCount: validationResult.validationMetadata?.expectedOptionCount,
      errors: validationResult.errors
    });
    
    // Prepare messages with enhanced system prompt
    const messages = [
      { role: "system" as const, content: enhancedSystemPrompt },
      ...conversationHistory,
      { role: "user" as const, content: userMessage },
    ];
    
    // Extract configuration (same as original request)
    const model = chatbotConfig?.model || "gpt-4.1";
    const temperature = chatbotConfig?.temperature ? chatbotConfig.temperature / 10 : 0.7;
    const maxTokens = chatbotConfig?.maxTokens || 2000;
    
    console.log(`[SURVEY REGENERATION] Calling OpenAI API with model: ${model}`);
    
    // Make non-streaming regeneration call for faster processing
    const completion = await openai.chat.completions.create({
      model,
      messages,
      stream: false,
      response_format: {
        type: "json_schema",
        json_schema: MULTI_BUBBLE_RESPONSE_SCHEMA,
      },
      temperature,
      max_tokens: maxTokens,
    });
    
    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in regeneration response');
    }
    
    console.log(`[SURVEY REGENERATION] Received regenerated content (${content.length} chars)`);
    
    // Parse the regenerated response
    const regeneratedResponse = parseOpenAIResponse(content);
    
    console.log(`[SURVEY REGENERATION] Parsed ${regeneratedResponse.bubbles.length} bubbles from regenerated response`);
    
    return regeneratedResponse;
    
  } catch (error) {
    console.error(`[SURVEY REGENERATION] Regeneration failed:`, error);
    throw error;
  }
}

/**
 * Clean up completed survey sessions after first completion response
 */
async function cleanupCompletedSurveySession(sessionId: string): Promise<void> {
  try {
    const surveySession = await storage.getActiveSurveySession(sessionId);
    if (surveySession && surveySession.status === 'completed') {
      console.log(`[SURVEY CLEANUP] Deactivating completed survey session ${surveySession.id} for session ${sessionId}`);
      await storage.updateSurveySession(surveySession.id, { status: 'inactive' });
      console.log(`[SURVEY CLEANUP] Completed survey session deactivated to prevent repeated injection`);
    }
  } catch (error) {
    console.error("[SURVEY CLEANUP] Error cleaning up completed survey session:", error);
  }
}

/**
 * Generate streaming response with bubble-by-bubble parsing
 */
export async function* generateStreamingResponse(
  userMessage: string,
  sessionId: string,
  conversationHistory: ConversationMessage[] = [],
  chatbotConfig?: any,
): AsyncGenerator<StreamingBubbleEvent, void, unknown> {
  console.log(`[OpenAI] Starting streaming response for: "${userMessage}"`);

  if (!isOpenAIConfigured()) {
    console.error("[OpenAI] API key not found in environment variables");
    throw new Error("OpenAI API key not configured");
  }

  try {
    const openai = getOpenAIClient();
    
    // Build complete system prompt with all contexts
    const { systemPrompt } = await buildCompleteSystemPrompt(
      chatbotConfig, 
      sessionId, 
      // Use last 4 messages for better context in streaming
      conversationHistory.slice(-4).map(msg => msg.content).join("\n") || userMessage
    );
    console.log(`[OpenAI] Using system prompt: ${systemPrompt}`)
    // Extract configuration
    const model = chatbotConfig?.model || "gpt-4.1";
    const temperature = chatbotConfig?.temperature
      ? chatbotConfig.temperature / 10
      : 0.7;
    const maxTokens = chatbotConfig?.maxTokens || 2000;

    console.log(
      `[OpenAI] Streaming with model: ${model}, temperature: ${temperature}, maxTokens: ${maxTokens}`,
    );

    // Prepare messages
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...conversationHistory,
      { role: "user" as const, content: userMessage },
    ];

    // Create streaming request with retry logic
    let stream: any = null;
    let retryAttempt = 0;
    const maxRetries = 1;
    
    while (retryAttempt <= maxRetries) {
      try {
        stream = await openai.chat.completions.create({
          model,
          messages,
          stream: true,
          response_format: {
            type: "json_schema",
            json_schema: MULTI_BUBBLE_RESPONSE_SCHEMA,
          },
          temperature,
          max_tokens: maxTokens,
        });
        break; // Success, exit retry loop
      } catch (apiError) {
        retryAttempt++;
        console.error(`[OpenAI] API call attempt ${retryAttempt} failed:`, apiError);
        
        if (retryAttempt <= maxRetries) {
          console.log(`[OpenAI] Retrying API call (attempt ${retryAttempt + 1}/${maxRetries + 1})...`);
          // Wait 1 second before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.error(`[OpenAI] All retry attempts failed, falling back to error message`);
          throw apiError; // Re-throw after all retries exhausted
        }
      }
    }
    
    if (!stream) {
      throw new Error("Failed to create OpenAI stream after retries");
    }

    // Streaming state
    let accumulatedContent = "";
    let processedBubbles = 0;
    let lastBubbleTime = 0;
    const BUBBLE_DELAY_MS = 1000; // Delay between bubbles

    // Helper function to manage bubble delays
    const applyBubbleDelay = async () => {
      const now = Date.now();
      const timeSinceLastBubble = now - lastBubbleTime;

      if (processedBubbles > 0 && timeSinceLastBubble < BUBBLE_DELAY_MS) {
        const remainingDelay = BUBBLE_DELAY_MS - timeSinceLastBubble;
        await new Promise((resolve) => setTimeout(resolve, remainingDelay));
      }

      lastBubbleTime = Date.now();
    };

    // Process streaming chunks
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      if (delta) {
        accumulatedContent += delta;
        const jsonEnded = detectJsonBoundary(delta, accumulatedContent);

        // Try to parse and yield complete bubbles
        if (jsonEnded) {
          const parseResult = parseStreamingContent(accumulatedContent);
          
          if (parseResult.success && parseResult.bubbles) {
            const bubbles = parseResult.bubbles;

            // Process new complete bubbles
            for (let i = processedBubbles; i < bubbles.length; i++) {
              const bubble = bubbles[i];
              
              // Skip menu and multiselect_menu bubbles during streaming
              // They will be processed in the final step to ensure completeness
              if (bubble.messageType === "menu" || bubble.messageType === "multiselect_menu") {
                console.log(`[OpenAI] Skipping menu bubble ${i + 1} during streaming - will process in final step`);
                continue;
              }
              
              if (isBubbleComplete(bubble)) {
                console.log(`[OpenAI] Streaming bubble ${i + 1}: ${bubble.messageType}`);
                
                await applyBubbleDelay();
                yield { type: "bubble", bubble };
                processedBubbles = i + 1;
              }
            }
          }
        }
      }
    }

    // Final processing
    try {
      console.log(
        `[OpenAI] Final accumulated content length: ${accumulatedContent.length}`,
      );
      
      let validated = parseOpenAIResponse(accumulatedContent);
      
      // Enhanced survey menu validation with regeneration capability
      const validationResult = await validateSurveyMenuRequirements(sessionId, validated);

      // Dynamic content validation for non-survey interactive elements
      const dynamicValidation = validateDynamicContent(validated);
      
      // Log dynamic validation results
      if (!dynamicValidation.isValid || dynamicValidation.warnings.length > 0) {
        console.warn(`[DYNAMIC VALIDATION] Validation result:`, {
          isComplete: dynamicValidation.isComplete,
          errors: dynamicValidation.errors,
          warnings: dynamicValidation.warnings,
          expectations: dynamicValidation.expectations,
          actual: dynamicValidation.actualContent,
          needsRegeneration: dynamicValidation.needsRegeneration
        });
      }
      
      if (!validationResult.isValid && validationResult.needsRegeneration) {
        console.warn(`[SURVEY VALIDATION] Menu validation failed, attempting regeneration:`, validationResult.errors);
        
        if (validationResult.validationMetadata) {
          console.log(`[SURVEY VALIDATION] Expected format:`, {
            messageType: validationResult.validationMetadata.expectedMessageType,
            optionCount: validationResult.validationMetadata.expectedOptionCount,
            expectedTexts: validationResult.validationMetadata.expectedOptions?.map(o => o.text) || []
          });
        }
        
        try {
          // Attempt regeneration with enhanced prompt
          const regeneratedResponse = await regenerateResponseWithValidation(
            userMessage,
            conversationHistory,
            systemPrompt,
            validationResult,
            chatbotConfig
          );
          
          // Re-validate the regenerated response
          const revalidationResult = await validateSurveyMenuRequirements(sessionId, regeneratedResponse);
          
          if (revalidationResult.isValid) {
            console.log(`[SURVEY REGENERATION SUCCESS] Regenerated response passed validation`);
            validated = regeneratedResponse;
            console.log(`[SURVEY REGENERATION] Using regenerated response with ${validated.bubbles.length} bubbles`);
          } else {
            console.warn(`[SURVEY REGENERATION FAILED] Regenerated response still failed validation:`, revalidationResult.errors);
            console.warn(`[SURVEY VALIDATION] Using original response despite regeneration failure`);
          }
        } catch (regenerationError) {
          console.error(`[SURVEY REGENERATION ERROR] Regeneration attempt failed:`, regenerationError);
          console.warn(`[SURVEY VALIDATION] Using original response due to regeneration error`);
        }
      }
      
      // Handle dynamic content validation failures with regeneration
      if (!dynamicValidation.isValid && dynamicValidation.needsRegeneration) {
        console.warn(`[DYNAMIC VALIDATION] Dynamic content validation failed, attempting regeneration:`, dynamicValidation.errors);
        
        if (dynamicValidation.expectations) {
          console.log(`[DYNAMIC VALIDATION] Expected content:`, {
            menuOptions: dynamicValidation.expectations.expectedMenuOptions,
            quickReplies: dynamicValidation.expectations.expectedQuickReplies,
            interactiveElements: dynamicValidation.expectations.expectedInteractiveElements,
            intent: dynamicValidation.expectations.contentIntent
          });
          
          console.log(`[DYNAMIC VALIDATION] Actual content:`, dynamicValidation.actualContent);
        }
        
        try {
          // Skip dynamic regeneration if we already regenerated for survey validation
          // to avoid double regeneration conflicts
          if (!validationResult.isValid && validationResult.needsRegeneration) {
            console.log(`[DYNAMIC VALIDATION] Skipping dynamic regeneration - already regenerated for survey validation`);
          } else {
            // Attempt regeneration with enhanced prompt for dynamic content
            const regeneratedResponse = await regenerateResponseWithDynamicValidation(
              userMessage,
              conversationHistory,
              systemPrompt,
              dynamicValidation,
              chatbotConfig
            );
            
            // Re-validate the regenerated response
            const dynamicRevalidation = validateDynamicContent(regeneratedResponse);
            
            if (dynamicRevalidation.isValid) {
              console.log(`[DYNAMIC REGENERATION SUCCESS] Regenerated response passed dynamic validation`);
              validated = regeneratedResponse;
              console.log(`[DYNAMIC REGENERATION] Using regenerated response with ${validated.bubbles.length} bubbles`);
            } else {
              console.warn(`[DYNAMIC REGENERATION FAILED] Regenerated response still failed dynamic validation:`, dynamicRevalidation.errors);
              console.warn(`[DYNAMIC VALIDATION] Using original response despite dynamic regeneration failure`);
            }
          }
        } catch (regenerationError) {
          console.error(`[DYNAMIC REGENERATION ERROR] Dynamic regeneration attempt failed:`, regenerationError);
          console.warn(`[DYNAMIC VALIDATION] Using original response due to dynamic regeneration error`);
        }
      }

      // Yield any remaining bubbles that weren't processed during streaming
      for (let i = processedBubbles; i < validated.bubbles.length; i++) {
        const bubble = validated.bubbles[i];
        console.log(`[OpenAI] Final bubble ${i + 1}: ${bubble.messageType}`);

        if (i > processedBubbles) {
          await new Promise((resolve) => setTimeout(resolve, BUBBLE_DELAY_MS));
        }

        yield { type: "bubble", bubble };
      }

      console.log(
        `[OpenAI] Streaming complete. Generated ${validated.bubbles.length} bubbles total`,
      );
      yield { type: "complete", content: "streaming_complete" };
      
      // Clean up completed survey sessions to prevent repeated injection
      await cleanupCompletedSurveySession(sessionId);
      
    } catch (parseError) {
      console.error("[OpenAI] Error parsing final response:", parseError);
      
      // Try to salvage the response
      const salvaged = attemptResponseSalvage(accumulatedContent);
      if (salvaged) {
        for (let i = processedBubbles; i < salvaged.bubbles.length; i++) {
          const bubble = salvaged.bubbles[i];
          console.log(`[OpenAI] Salvaged bubble ${i + 1}: ${bubble.messageType}`);
          yield { type: "bubble", bubble };
        }
        
        console.log("[OpenAI] Successfully salvaged response");
        yield { type: "complete", content: "streaming_complete" };
        
        // Clean up completed survey sessions to prevent repeated injection
        await cleanupCompletedSurveySession(sessionId);
        return;
      }
      
      // Final fallback
      const fallbackBubble = {
        messageType: "text" as const,
        content: "I apologize, but I'm having trouble generating a response right now. Please try again.",
        metadata: {}
      };
      
      yield { type: "bubble", bubble: fallbackBubble };
      yield { type: "complete", content: "streaming_complete" };
    }
  } catch (error) {
    console.error("[OpenAI] Error in streaming response:", error);
    yield {
      type: "complete",
      content: "I apologize, but I'm having trouble generating a response right now. Please try again.",
      messageType: "text",
    };
  }
}