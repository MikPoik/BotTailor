/**
 * Singleton OpenAI client and configuration helpers for AI orchestration.
 *
 * Responsibilities:
 * - Provides a singleton OpenAI client instance for all API calls.
 * - Ensures OPENAI_API_KEY is set and throws if missing.
 * - Used by all OpenAI domain modules for model calls.
 *
 * Constraints & Edge Cases:
 * - Throws if OPENAI_API_KEY is not set in the environment.
 * - Client is lazily initialized and reused for efficiency.
 */
import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

/**
 * Initialize and return the OpenAI client instance
 * Ensures singleton pattern for efficient resource usage
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }
    
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  return openaiClient;
}

/**
 * Check if OpenAI client is properly configured
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}