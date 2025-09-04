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
 * Generate prompt assistance response using OpenAI
 */
export async function generatePromptAssistance(
  action: string,
  userMessage: string,
  chatbotContext: {
    name?: string;
    description?: string;
    currentPrompt?: string;
  }
): Promise<AIResponse> {
  console.log(`[OpenAI] Generating prompt assistance for action: "${action}"`);

  if (!isOpenAIConfigured()) {
    console.error("[OpenAI] API key not found in environment variables");
    throw new Error("OpenAI API key not configured");
  }

  try {
    const openai = getOpenAIClient();
    
    // Build system prompt for the prompt assistant
    let assistantPrompt = `You are an expert AI prompt engineer specializing in creating and improving system prompts for chatbots. Your role is to help users create effective, clear, and well-structured system prompts that will make their chatbots perform better.

Context about the chatbot:
- Name: ${chatbotContext?.name || 'Untitled Chatbot'}
- Description: ${chatbotContext?.description || 'No description provided'}
- Current System Prompt: ${chatbotContext?.currentPrompt || 'No current prompt'}

Guidelines for creating effective system prompts:
1. Be specific about the chatbot's role and personality
2. Define the chatbot's knowledge domain and limitations
3. Specify the tone and communication style
4. Include instructions for handling edge cases
5. Keep it clear and concise while being comprehensive
6. Use examples when helpful

Response Format: Always respond with a multi-bubble response where:
- For "generate" action: First bubble contains ONLY the clean, ready-to-use system prompt. Second bubble contains analysis and explanation.
- For "improve" action: First bubble contains ONLY the clean, improved system prompt. Second bubble contains detailed explanation of changes.
- For "chat" action: Single bubble with helpful advice or answers about prompt engineering.

Be helpful, constructive, and provide actionable suggestions.`;

    // Handle different actions
    switch (action) {
      case 'generate':
        assistantPrompt += `\n\nUser Request: Generate a complete system prompt for this chatbot. Base it on the chatbot's name, description, and intended use case.

IMPORTANT FORMATTING: Provide your response as exactly 2 message bubbles:
1. First bubble: ONLY the clean, ready-to-use system prompt without any headers, explanations, or formatting markers
2. Second bubble: Your analysis and explanation of the prompt choices`;
        break;
      case 'improve':
        assistantPrompt += `\n\nUser Request: Analyze and improve the current system prompt. Provide the improved version and explain what changes were made and why.

IMPORTANT FORMATTING: Provide your response as exactly 2 message bubbles:
1. First bubble: ONLY the clean, improved system prompt without any headers, explanations, formatting markers, or prefixes like "**Improved System Prompt:**"
2. Second bubble: Your detailed explanation of what changes were made and why`;
        break;
      case 'chat':
        assistantPrompt += `\n\nUser Question: ${userMessage}`;
        break;
      default:
        throw new Error("Invalid action. Must be 'generate', 'improve', or 'chat'");
    }

    // Prepare messages
    const messages = [
      { role: "system" as const, content: assistantPrompt },
      { role: "user" as const, content: userMessage || `Please ${action} a system prompt for this chatbot.` },
    ];

    // Create request with JSON schema
    const stream = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages,
      stream: true,
      response_format: {
        type: "json_schema",
        json_schema: MULTI_BUBBLE_RESPONSE_SCHEMA,
      },
      temperature: 0.7,
      max_tokens: 2000,
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
    return handleCriticalError(error, "prompt assistance generation");
  }
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