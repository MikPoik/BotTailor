/**
 * Main export file for modular OpenAI service
 * Provides backward compatibility with the original openai-service.ts
 */

// Re-export all public functions to maintain backward compatibility
export { 
  generateMultiBubbleResponse,
  generateOptionResponse,
  generateStructuredResponse,
  generatePromptAssistance,
  generateSurveyAssistance
} from "./response-generator";

export { generateStreamingResponse } from "./streaming-handler";

// Re-export client utilities for advanced usage
export { getOpenAIClient, isOpenAIConfigured } from "./client";

// Re-export context builders for custom implementations
export { 
  buildWebsiteContext, 
  buildActiveSurveyContext, 
  buildCompleteSystemPrompt 
} from "./context-builder";

// Re-export response parsing utilities
export { 
  parseOpenAIResponse, 
  parseStreamingContent, 
  isBubbleComplete,
  validateSurveyMenuRequirements 
} from "./response-parser";

// Re-export error handling utilities
export { 
  generateFallbackResponse, 
  handleParseError, 
  handleCriticalError 
} from "./error-handler";

// Re-export schema for external usage
export { MULTI_BUBBLE_RESPONSE_SCHEMA } from "./schema";

// Re-export types for TypeScript consumers
export type { ConversationMessage, ChatConfig } from "./response-generator";
export type { StreamingBubbleEvent } from "./streaming-handler";