import type { AIResponse } from "../ai-response-schema";

/**
 * OpenAI error handling and fallback response logic for API endpoints.
 *
 * Responsibilities:
 * - Generates fallback AIResponse for error cases (malformed, partial, or failed model output).
 * - Attempts to salvage single-message or plain text responses from malformed output.
 * - Used by response-parser and streaming handlers to ensure robust API contracts.
 *
 * Constraints & Edge Cases:
 * - Fallback response must always be a valid AIResponse (single text bubble).
 * - Salvage logic must handle both object and string output.
 */

/**
 * Generates a fallback AIResponse for error cases (malformed/failed output).
 * Always returns a valid single text bubble.
 * @returns AIResponse
 */
export function generateFallbackResponse(): AIResponse {
  return {
    bubbles: [
      {
        messageType: "text",
        content:
          "I apologize, but I'm having trouble generating a response right now. Please try again.",
        metadata: {},
      },
    ],
  };
}

/**
 * Attempt to salvage a malformed response by parsing it as a single message
 */
export function attemptResponseSalvage(accumulatedContent: string): AIResponse | null {
  try {
    const singleMessage = JSON.parse(accumulatedContent);
    if (singleMessage.messageType && singleMessage.content !== undefined) {
      console.log("[OpenAI] Successfully salvaged single message response");
      return {
        bubbles: [singleMessage]
      };
    }
    
    // Try to extract content if it's a plain text response
    if (typeof singleMessage === 'string') {
      console.log("[OpenAI] Salvaging plain text response");
      return {
        bubbles: [{
          messageType: "text",
          content: singleMessage,
          metadata: {}
        }]
      };
    }
    
    // Try to find any content that looks like a message
    if (singleMessage.content) {
      console.log("[OpenAI] Salvaging response with content field");
      return {
        bubbles: [{
          messageType: "text",
          content: singleMessage.content,
          metadata: {}
        }]
      };
    }
  } catch (salvageError) {
    // Try to parse as plain text if JSON parsing fails
    if (accumulatedContent && typeof accumulatedContent === 'string' && accumulatedContent.trim().length > 0) {
      console.log("[OpenAI] Salvaging as plain text content");
      return {
        bubbles: [{
          messageType: "text",
          content: accumulatedContent.trim(),
          metadata: {}
        }]
      };
    }
    console.log("[OpenAI] Could not salvage response");
  }
  
  return null;
}

/**
 * Handle parsing errors with appropriate logging and fallback
 */
export function handleParseError(
  parseError: unknown, 
  accumulatedContent: string, 
  context: string = "response generation"
): AIResponse {
  console.error(`[OpenAI] Error ${context}:`, parseError);
  console.log(`[OpenAI] Raw content that failed to parse (${accumulatedContent.length} chars):`, accumulatedContent?.substring(0, 500) + (accumulatedContent?.length > 500 ? '...' : ''));
  
  // Always try to salvage if we have content, regardless of error type
  if (accumulatedContent && accumulatedContent.trim().length > 0) {
    console.log(`[OpenAI] Attempting to salvage response from parsing error in ${context}`);
    
    const salvaged = attemptResponseSalvage(accumulatedContent);
    if (salvaged) {
      console.log(`[OpenAI] Successfully salvaged response for ${context}`);
      return salvaged;
    }
  }
  
  // Return fallback response
  console.log(`[OpenAI] Using fallback response for ${context}`);
  return generateFallbackResponse();
}

/**
 * Handle critical errors with logging
 */
export function handleCriticalError(error: unknown, context: string = "OpenAI service"): AIResponse {
  console.error(`[OpenAI] Critical error in ${context}:`, error);
  return generateFallbackResponse();
}