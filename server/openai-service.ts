
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
  try {
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user' as const, content: userMessage }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "chat_response",
          schema: {
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
      }
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error("No response content from OpenAI");
    }

    const parsedResponse = JSON.parse(responseContent);
    
    // Validate the response using Zod
    const validatedResponse = AIResponseSchema.parse(parsedResponse);
    
    return validatedResponse;
  } catch (error) {
    console.error("Error generating structured response:", error);
    
    // Fallback response
    return {
      messageType: "text",
      content: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
      metadata: {
        quickReplies: ["Try again", "Contact support", "Main menu"]
      }
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
