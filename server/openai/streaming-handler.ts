import { getOpenAIClient, isOpenAIConfigured } from "./client";
import { MULTI_BUBBLE_RESPONSE_SCHEMA } from "./schema";
import { buildCompleteSystemPrompt } from "./context-builder";
import { 
  parseStreamingContent, 
  isBubbleComplete, 
  detectJsonBoundary,
  parseOpenAIResponse,
  validateSurveyMenuRequirements 
} from "./response-parser";
import { handleCriticalError, generateFallbackResponse, attemptResponseSalvage } from "./error-handler";
import type { ConversationMessage } from "./response-generator";

export interface StreamingBubbleEvent {
  type: "bubble" | "complete";
  bubble?: any;
  content?: string;
  messageType?: string;
  metadata?: any;
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

    // Extract configuration
    const model = chatbotConfig?.model || "gpt-4o";
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
              
              if (isBubbleComplete(bubble)) {
                console.log(`[OpenAI] Streaming bubble ${i + 1}: ${bubble.messageType}`);
                
                await applyBubbleDelay();
                yield { type: "bubble", bubble };
                processedBubbles = i + 1;
              } else if (bubble.messageType === "menu") {
                // Log incomplete menu for debugging
                console.warn(
                  `[SURVEY MENU WARNING] Menu bubble ${i + 1} has incomplete options, waiting for complete response...`,
                  bubble.metadata?.options?.map((opt: any) => ({
                    id: opt?.id || 'MISSING',
                    text: opt?.text || 'MISSING',
                    action: opt?.action || 'MISSING'
                  }))
                );
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
      
      const validated = parseOpenAIResponse(accumulatedContent);
      
      // Validate survey menu requirements
      await validateSurveyMenuRequirements(sessionId, validated);

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