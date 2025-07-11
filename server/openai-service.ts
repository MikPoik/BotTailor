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
                      enum: ["text", "card", "menu", "image", "quickReplies", "form"]
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
                        },
                        formFields: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              label: { type: "string" },
                              type: { 
                                type: "string",
                                enum: ["text", "email", "textarea"]
                              },
                              placeholder: { type: "string" },
                              required: { type: "boolean" },
                              value: { type: "string" }
                            },
                            required: ["id", "label", "type"]
                          }
                        },
                        submitButton: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            text: { type: "string" },
                            action: { type: "string" },
                            payload: {}
                          },
                          required: ["id", "text", "action"]
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
                      enum: ["text", "card", "menu", "image", "quickReplies", "form"]
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
                        },
                        formFields: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              label: { type: "string" },
                              type: { 
                                type: "string",
                                enum: ["text", "email", "textarea"]
                              },
                              placeholder: { type: "string" },
                              required: { type: "boolean" },
                              value: { type: "string" }
                            },
                            required: ["id", "label", "type"]
                          }
                        },
                        submitButton: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            text: { type: "string" },
                            action: { type: "string" },
                            payload: {}
                          },
                          required: ["id", "text", "action"]
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
    let lastBubbleTime = 0;
    const BUBBLE_DELAY_MS = 1000; // 500ms delay between bubbles

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        //console.log(`[OpenAI] Delta: ${delta}`);
        accumulatedContent += delta;
        let jsonEnded = false;
        if (delta.includes("},{")) {
          jsonEnded = true;
        }

        // Use best-effort parser to extract any complete bubbles from incomplete JSON
        try {
          const parseResult = parse(accumulatedContent);
          //console.log(`[OpenAI] Parse result: ${JSON.stringify(parseResult)}`);
          //console.log(`[OpenAI] Data: ${JSON.stringify(parseResult.bubbles)}`)
          if (parseResult.bubbles && Array.isArray(parseResult.bubbles) && jsonEnded) {
            const bubbles = parseResult.bubbles;

            // Check if we have new complete bubbles beyond what we've already processed
            for (let i = processedBubbles; i < bubbles.length; i++) {
              const bubble = bubbles[i];
              console.log(JSON.stringify(bubble));
              // Check if this bubble is complete (has required fields)
              if (bubble.messageType && bubble.content !== undefined) {
                // For menu type, also check if metadata.options is complete
                const shouldYieldBubble = async () => {
                  const now = Date.now();
                  const timeSinceLastBubble = now - lastBubbleTime;

                  // If this isn't the first bubble and we haven't waited long enough, add delay
                  if (processedBubbles > 0 && timeSinceLastBubble < BUBBLE_DELAY_MS) {
                    const remainingDelay = BUBBLE_DELAY_MS - timeSinceLastBubble;
                    await new Promise(resolve => setTimeout(resolve, remainingDelay));
                  }

                  lastBubbleTime = Date.now();
                  return true;
                };

                if (bubble.messageType === 'menu') {
                  if (bubble.metadata?.options && Array.isArray(bubble.metadata.options) && bubble.metadata.options.length > 0) {
                    // Check if all options have required fields
                    const allOptionsComplete = bubble.metadata.options.every(opt => 
                      opt.id && opt.text && opt.action
                    );
                    if (allOptionsComplete) {
                      console.log(`[OpenAI] Streaming bubble ${i + 1}: ${bubble.messageType} (menu with ${bubble.metadata.options.length} options)`);
                      await shouldYieldBubble();
                      yield { type: 'bubble', bubble };
                      processedBubbles = i + 1;
                    }
                  }
                } else if (bubble.messageType === 'form') {
                  // For form bubbles, ensure all required form fields are complete
                  if (bubble.metadata?.formFields && Array.isArray(bubble.metadata.formFields) && bubble.metadata.formFields.length > 0) {
                    // Check if all form fields have required properties
                    const allFieldsComplete = bubble.metadata.formFields.every(field => 
                      field && field.id && field.label && field.type
                    );
                    if (allFieldsComplete) {
                      console.log(`[OpenAI] Streaming bubble ${i + 1}: ${bubble.messageType} (form with ${bubble.metadata.formFields.length} fields)`);
                      await shouldYieldBubble();
                      yield { type: 'bubble', bubble };
                      processedBubbles = i + 1;
                    }
                  }
                } else if (bubble.messageType === 'text') {
                  // For text bubbles, ensure content is not just empty string
                  if (bubble.content && bubble.content.trim().length > 0) {
                    console.log(`[OpenAI] Streaming bubble ${i + 1}: ${bubble.messageType} - "${bubble.content}"`);
                    await shouldYieldBubble();
                    yield { type: 'bubble', bubble };
                    processedBubbles = i + 1;
                  }
                } else {
                  // For other types (card, image, quickReplies), just check basic completion
                  console.log(`[OpenAI] Streaming bubble ${i + 1}: ${bubble.messageType} - "${bubble.content}"`);
                  await shouldYieldBubble();
                  yield { type: 'bubble', bubble };
                  processedBubbles = i + 1;
                }
              }
            }
          }
        } catch (parseError) {
          // Silently ignore parsing errors during streaming - we'll try again with more content
        }
      }
    }

    // Final parse to ensure we got everything
    try {
      console.log(`[OpenAI] Final accumulated content length: ${accumulatedContent.length}, content: ${accumulatedContent}`);
      const finalParseResult = JSON.parse(accumulatedContent);
      console.log(`[OpenAI] Final parse successful, validating schema...`);

      const validated = AIResponseSchema.parse(finalParseResult);

      // Yield any remaining bubbles that weren't processed during streaming
      for (let i = processedBubbles; i < validated.bubbles.length; i++) {
        const bubble = validated.bubbles[i];
        console.log(`[OpenAI] Final bubble ${i + 1}: ${bubble.messageType}`);

        // Apply delay for remaining bubbles too
        if (i > processedBubbles) {
          await new Promise(resolve => setTimeout(resolve, BUBBLE_DELAY_MS));
        }

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