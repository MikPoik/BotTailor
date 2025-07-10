import OpenAI from "openai";
import { AIResponseSchema, SYSTEM_PROMPT, type AIResponse } from "./ai-response-schema";
import { parse } from "best-effort-json-parser";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});



// Non-streaming function for multi-bubble responses
export async function generateMultiBubbleResponse(
  userMessage: string,
  sessionId: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<AIResponse> {
  console.log(`[OpenAI] Generating multi-bubble response for: "${userMessage}"`);

  if (!process.env.OPENAI_API_KEY) {
    console.error("[OpenAI] API key not found in environment variables");
    throw new Error("OpenAI API key not configured");
  }

  try {
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user' as const, content: userMessage }
    ];

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      stream: true,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "multi_bubble_response",
          schema: {
            type: "object",
            properties: {
              bubbles: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    messageType: {
                      type: "string",
                      enum: ["text", "card", "menu", "image", "quickReplies"]
                    },
                    content: {
                      type: "string"
                    },
                    metadata: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        imageUrl: { type: "string" },
                        buttons: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              text: { type: "string" },
                              action: { type: "string" },
                              payload: {}
                            },
                            required: ["id", "text", "action"]
                          }
                        },
                        options: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              text: { type: "string" },
                              icon: { type: "string" },
                              action: { type: "string" },
                              payload: {}
                            },
                            required: ["id", "text", "action"]
                          }
                        },
                        quickReplies: {
                          type: "array",
                          items: { type: "string" }
                        }
                      }
                    }
                  },
                  required: ["messageType", "content"]
                }
              }
            },
            required: ["bubbles"]
          }
        }
      },
      temperature: 0.7,
      max_tokens: 1500
    });

    let accumulatedContent = '';
    
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        accumulatedContent += delta;
      }
    }

    const parsedResponse = JSON.parse(accumulatedContent);
    console.log(`[OpenAI] Raw response: ${accumulatedContent}`);
    
    // Validate against schema
    const validated = AIResponseSchema.parse(parsedResponse);
    console.log(`[OpenAI] Successfully generated ${validated.bubbles.length} message bubbles`);
    
    return validated;
  } catch (error) {
    console.error("[OpenAI] Error generating response:", error);
    // Return fallback response
    return {
      bubbles: [{
        messageType: "text",
        content: "I apologize, but I'm having trouble generating a response right now. Please try again.",
        metadata: {}
      }]
    };
  }
}

// Progressive streaming function with bubble-by-bubble parsing
export async function* generateStreamingResponse(
  userMessage: string,
  sessionId: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): AsyncGenerator<{ type: 'bubble' | 'complete', bubble?: any, content?: string, messageType?: string, metadata?: any }, void, unknown> {
  console.log(`[OpenAI] Starting streaming response for: "${userMessage}"`);

  if (!process.env.OPENAI_API_KEY) {
    console.error("[OpenAI] API key not found in environment variables");
    throw new Error("OpenAI API key not configured");
  }

  try {
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user' as const, content: userMessage }
    ];

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      stream: true,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "multi_bubble_response",
          schema: {
            type: "object",
            properties: {
              bubbles: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    messageType: {
                      type: "string",
                      enum: ["text", "card", "menu", "image", "quickReplies"]
                    },
                    content: {
                      type: "string"
                    },
                    metadata: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        imageUrl: { type: "string" },
                        buttons: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              text: { type: "string" },
                              action: { type: "string" },
                              payload: {}
                            },
                            required: ["id", "text", "action"]
                          }
                        },
                        options: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              text: { type: "string" },
                              icon: { type: "string" },
                              action: { type: "string" },
                              payload: {}
                            },
                            required: ["id", "text", "action"]
                          }
                        },
                        quickReplies: {
                          type: "array",
                          items: { type: "string" }
                        }
                      }
                    }
                  },
                  required: ["messageType", "content"]
                }
              }
            },
            required: ["bubbles"]
          }
        }
      },
      temperature: 0.7,
      max_tokens: 1500
    });

    let accumulatedContent = '';
    let processedBubbles = 0;
    
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        console.log(`[OpenAI] Delta: "${delta}"`);
        accumulatedContent += delta;
        
        // Try progressive bubble detection using pattern matching
        const detectedBubbles = detectStreamingBubbles(accumulatedContent, processedBubbles);
        
        for (const bubble of detectedBubbles) {
          console.log(`[OpenAI] Streaming bubble ${processedBubbles + 1}: ${bubble.messageType} - "${bubble.content}"`);
          yield { type: 'bubble', bubble };
          processedBubbles++;
        }
      }
    }

    // Final parse to ensure we got everything
    try {
      console.log(`[OpenAI] Final accumulated content length: ${accumulatedContent.length}`);
      const finalParseResult = JSON.parse(accumulatedContent);
      console.log(`[OpenAI] Final parse successful, validating schema...`);
      
      const validated = AIResponseSchema.parse(finalParseResult);
      
      // Yield any remaining bubbles that weren't processed during streaming
      for (let i = processedBubbles; i < validated.bubbles.length; i++) {
        const bubble = validated.bubbles[i];
        console.log(`[OpenAI] Final bubble ${i + 1}: ${bubble.messageType}`);
        yield { type: 'bubble', bubble };
      }
      
      console.log(`[OpenAI] Streaming complete. Generated ${validated.bubbles.length} bubbles total`);
      yield { type: 'complete', content: 'streaming_complete' };
      
    } catch (parseError) {
      console.error("[OpenAI] Error parsing final response:", parseError);
      console.error("[OpenAI] Accumulated content:", accumulatedContent);
      yield { 
        type: 'complete', 
        content: "I apologize, but I'm having trouble generating a response right now. Please try again.",
        messageType: 'text'
      };
    }

  } catch (error) {
    console.error("[OpenAI] Error in streaming response:", error);
    yield { 
      type: 'complete', 
      content: "I apologize, but I'm having trouble generating a response right now. Please try again.",
      messageType: 'text'
    };
  }
}

// Legacy compatibility function
export async function generateStructuredResponse(
  userMessage: string,
  sessionId: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<AIResponse> {
  return generateMultiBubbleResponse(userMessage, sessionId, conversationHistory);
}

export async function generateOptionResponse(
  optionId: string,
  payload: any,
  sessionId: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<AIResponse> {
  const contextMessage = `User selected option "${optionId}" with payload: ${JSON.stringify(payload)}. Provide a helpful response.`;
  return generateMultiBubbleResponse(contextMessage, sessionId, conversationHistory);
}