import OpenAI from "openai";
import { AIResponseSchema, SYSTEM_PROMPT, type AIResponse } from "./ai-response-schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateStructuredResponse(
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
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

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("No response content from OpenAI");
    }

    console.log(`[OpenAI] Raw response: ${responseContent}`);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (parseError) {
      console.error("[OpenAI] Failed to parse JSON response:", parseError);
      throw new Error("Invalid JSON response from OpenAI");
    }

    const validatedResponse = AIResponseSchema.parse(parsedResponse);
    console.log(`[OpenAI] Successfully generated ${validatedResponse.bubbles.length} message bubbles`);
    
    return validatedResponse;
  } catch (error) {
    console.error("[OpenAI] Error generating response:", error);
    
    // Fallback response with multi-bubble format
    return {
      bubbles: [
        {
          messageType: "text",
          content: "I'm sorry, I'm having trouble processing your request right now.",
        },
        {
          messageType: "quickReplies",
          content: "Would you like to:",
          metadata: {
            quickReplies: ["Try again", "Contact support", "Main menu"]
          }
        }
      ]
    };
  }
}

export async function generateOptionResponse(
  optionId: string,
  payload: any,
  sessionId: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<AIResponse> {
  const userMessage = `User selected option: ${optionId}${payload ? ` with payload: ${JSON.stringify(payload)}` : ''}`;

  return generateStructuredResponse(userMessage, sessionId, conversationHistory);
}