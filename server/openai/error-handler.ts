import type { AIResponse } from "../ai-response-schema";

/**
 * Generate fallback response for error cases
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
  } catch (salvageError) {
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
  
  // Try to salvage if it's a parsing error and we have content
  if (parseError instanceof SyntaxError && accumulatedContent) {
    console.log(`[OpenAI] Attempting to salvage response from parsing error in ${context}`);
    
    const salvaged = attemptResponseSalvage(accumulatedContent);
    if (salvaged) {
      return salvaged;
    }
  }
  
  // Return fallback response
  return generateFallbackResponse();
}

/**
 * Handle critical errors with logging
 */
export function handleCriticalError(error: unknown, context: string = "OpenAI service"): AIResponse {
  console.error(`[OpenAI] Critical error in ${context}:`, error);
  return generateFallbackResponse();
}