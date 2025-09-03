import { getOpenAIClient, isOpenAIConfigured } from "./client";
import { MULTI_BUBBLE_RESPONSE_SCHEMA } from "./schema";
import { buildCompleteSystemPrompt } from "./context-builder";
import { parseOpenAIResponse } from "./response-parser";
import { handleCriticalError } from "./error-handler";
import type { AIResponse } from "../ai-response-schema";

export interface ChatConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Generate multi-bubble response using OpenAI
 */
export async function generateMultiBubbleResponse(
  userMessage: string,
  sessionId: string,
  conversationHistory: ConversationMessage[] = [],
  chatbotConfig?: any,
): Promise<AIResponse> {
  console.log(
    `[OpenAI] Generating multi-bubble response for: "${userMessage}"`,
  );

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
      userMessage
    );

    // Extract configuration
    const model = chatbotConfig?.model || "gpt-4o";
    const temperature = chatbotConfig?.temperature
      ? chatbotConfig.temperature / 10
      : 0.7;
    const maxTokens = chatbotConfig?.maxTokens || 2000;

    console.log(
      `[OpenAI] Using model: ${model}, temperature: ${temperature}, maxTokens: ${maxTokens}`,
    );

    // Prepare messages
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...conversationHistory,
      { role: "user" as const, content: userMessage },
    ];

    // Create streaming request
    const stream = await openai.chat.completions.create({
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

    // Collect response
    let accumulatedContent = "";
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      if (delta) {
        accumulatedContent += delta;
      }
    }

    // Parse and validate response
    return parseOpenAIResponse(accumulatedContent);
  } catch (error) {
    return handleCriticalError(error, "multi-bubble response generation");
  }
}

/**
 * Generate response for option selection
 */
export async function generateOptionResponse(
  optionId: string,
  payload: any,
  sessionId: string,
  conversationHistory: ConversationMessage[] = [],
  chatbotConfig?: any,
): Promise<AIResponse> {
  const contextMessage = `User selected option "${optionId}"` +
    (payload !== undefined && payload !== null ? ` with payload: ${JSON.stringify(payload)}` : '') +
    ". Provide a helpful response.";
  
  return generateMultiBubbleResponse(
    contextMessage,
    sessionId,
    conversationHistory,
    chatbotConfig,
  );
}

/**
 * Legacy compatibility function
 */
export async function generateStructuredResponse(
  userMessage: string,
  sessionId: string,
  conversationHistory: ConversationMessage[] = [],
  chatbotConfig?: any,
): Promise<AIResponse> {
  return generateMultiBubbleResponse(
    userMessage,
    sessionId,
    conversationHistory,
    chatbotConfig,
  );
}