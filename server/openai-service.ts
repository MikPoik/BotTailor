import OpenAI from "openai";
import {
  AIResponseSchema,
  buildSystemPrompt,
  buildSurveyContext,
  type AIResponse,
} from "./ai-response-schema";
import { parse } from "best-effort-json-parser";
import { storage } from "./storage";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Non-streaming function for multi-bubble responses
export async function generateMultiBubbleResponse(
  userMessage: string,
  sessionId: string,
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }> = [],
  chatbotConfig?: any,
): Promise<AIResponse> {
  console.log(
    `[OpenAI] Generating multi-bubble response for: "${userMessage}"`,
  );

  if (!process.env.OPENAI_API_KEY) {
    console.error("[OpenAI] API key not found in environment variables");
    throw new Error("OpenAI API key not configured");
  }

  try {
    // Search for relevant website content if chatbot config is available
    let websiteContext = "";
    if (chatbotConfig?.id) {
      try {
        const relevantContent = await storage.searchSimilarContent(
          chatbotConfig.id,
          userMessage,
          3,
        );

        if (relevantContent.length > 0) {
          websiteContext =
            "\n\nRELEVANT CONTEXT FROM WEBSITE:\n" +
            relevantContent
              .map(
                (content, index) =>
                  `[${index + 1}] ${content.title || "Untitled"}\n${content.content.substring(0, 500)}...`,
              )
              .join("\n\n") +
            "\n\nUse this context to provide more accurate and relevant responses. If the context is relevant to the user's question, incorporate the information naturally into your response.";
        }
      } catch (error) {
        console.error("Error searching website content:", error);
        // Continue without website context if search fails
      }
    }

    // Use chatbot config system prompt or fallback to default
    const systemPrompt = buildSystemPrompt(chatbotConfig) + websiteContext;
    const model = chatbotConfig?.model || "gpt-4o";
    const temperature = chatbotConfig?.temperature
      ? chatbotConfig.temperature / 10
      : 0.7;
    const maxTokens = chatbotConfig?.maxTokens || 1500;

    console.log(
      `[OpenAI] Using model: ${model}, temperature: ${temperature}, maxTokens: ${maxTokens}`,
    );
    //console.log(`[OpenAI] System prompt: ${systemPrompt}`);
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...conversationHistory,
      { role: "user" as const, content: userMessage },
    ];

    const stream = await openai.chat.completions.create({
      model,
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
                      enum: [
                        "text",
                        "card",
                        "menu",
                        "image",
                        "quickReplies",
                        "form",
                      ],
                    },
                    content: {
                      type: "string",
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
                              payload: {},
                            },
                            required: ["id", "text", "action"],
                          },
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
                              payload: {},
                            },
                            required: ["id", "text", "action"],
                          },
                        },
                        quickReplies: {
                          type: "array",
                          items: { type: "string" },
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
                                enum: ["text", "email", "textarea"],
                              },
                              placeholder: { type: "string" },
                              required: { type: "boolean" },
                              value: { type: "string" },
                            },
                            required: ["id", "label", "type"],
                          },
                        },
                        submitButton: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            text: { type: "string" },
                            action: { type: "string" },
                            payload: {},
                          },
                          required: ["id", "text", "action"],
                        },
                      },
                    },
                  },
                  required: ["messageType", "content"],
                },
              },
            },
            required: ["bubbles"],
          },
        },
      },
      temperature,
      max_tokens: maxTokens,
    });

    let accumulatedContent = "";

    try {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || "";
        if (delta) {
          accumulatedContent += delta;
        }
      }

      const parsedResponse = JSON.parse(accumulatedContent);
      console.log(`[OpenAI] Raw response: ${accumulatedContent}`);

      // Validate against schema
      const validated = AIResponseSchema.parse(parsedResponse);
      console.log(
        `[OpenAI] Successfully generated ${validated.bubbles.length} message bubbles`,
      );

      return validated;
    } catch (parseError) {
      console.error("[OpenAI] Error generating response:", parseError);
      
      // Try to salvage if it's a parsing error and we have content
      if (parseError instanceof SyntaxError && accumulatedContent) {
        console.log("[OpenAI] Attempting to salvage response from parsing error");
        try {
          // Try to parse as single message and wrap in bubbles array
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
      }
      
      // Return fallback response
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
  } catch (error) {
    console.error("[OpenAI] Critical error:", error);
    return {
      bubbles: [
        {
          messageType: "text",
          content: "I apologize, but I'm having trouble generating a response right now. Please try again.",
          metadata: {},
        },
      ],
    };
  }
}

// Progressive streaming function with bubble-by-bubble parsing
export async function* generateStreamingResponse(
  userMessage: string,
  sessionId: string,
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }> = [],
  chatbotConfig?: any,
): AsyncGenerator<
  {
    type: "bubble" | "complete";
    bubble?: any;
    content?: string;
    messageType?: string;
    metadata?: any;
  },
  void,
  unknown
> {
  console.log(`[OpenAI] Starting streaming response for: "${userMessage}"`);

  if (!process.env.OPENAI_API_KEY) {
    console.error("[OpenAI] API key not found in environment variables");
    throw new Error("OpenAI API key not configured");
  }

  try {
    let websiteContext = "";
    if (chatbotConfig?.id) {
      try {
        const relevantContent = await storage.searchSimilarContent(
          chatbotConfig.id,
          userMessage,
          3,
        );
        console.log(
          `[OpenAI] Found ${relevantContent.length} relevant content chunks`,
        );
        if (relevantContent.length > 0) {
          websiteContext =
            "\n\nRELEVANT CONTEXT FROM WEBSITE:\n" +
            relevantContent
              .map(
                (content, index) =>
                  `[${index + 1}] ${content.title || "Untitled"}\n${content.content.substring(0, 800)}...`,
              )
              .join("\n\n") +
            "\n\nUse this context to provide more accurate and relevant responses. If the context is relevant to the user's question, incorporate the information naturally into your response.";
        }
      } catch (error) {
        console.error("Error searching website content:", error);
        // Continue without website context if search fails
      }
    }

    // Check for active survey and build context
    let surveyContext = "";
    console.log(`[SURVEY] Checking for survey context for session: ${sessionId}`);
    
    try {
      const surveySession = await storage.getSurveySessionBySessionId(sessionId);
      console.log(`[SURVEY] Survey session found:`, surveySession ? { 
        id: surveySession.id, 
        surveyId: surveySession.surveyId, 
        status: surveySession.status,
        currentQuestionIndex: surveySession.currentQuestionIndex
      } : null);
      
      if (surveySession && surveySession.status === 'active') {
        const survey = await storage.getSurvey(surveySession.surveyId);
        console.log(`[SURVEY] Survey found:`, survey ? {
          id: survey.id,
          title: survey.surveyConfig?.title,
          questionCount: survey.surveyConfig?.questions?.length
        } : null);
        
        if (survey) {
          surveyContext = buildSurveyContext(survey, surveySession);
          console.log(`[SURVEY] Built survey context (${surveyContext.length} chars):`, surveyContext.substring(0, 500) + '...');
        }
      }
    } catch (error) {
      console.error("[SURVEY] Error building survey context:", error);
    }

    // Use chatbot config system prompt or fallback to default
    const systemPrompt = buildSystemPrompt(chatbotConfig) + websiteContext + surveyContext;
    const model = chatbotConfig?.model || "gpt-4o";
    const temperature = chatbotConfig?.temperature
      ? chatbotConfig.temperature / 10
      : 0.7;
    const maxTokens = chatbotConfig?.maxTokens || 1500;

    console.log(
      `[OpenAI] Streaming with model: ${model}, temperature: ${temperature}, maxTokens: ${maxTokens}`,
    );
    if (surveyContext) {
      console.log(`[SURVEY] Using survey context in system prompt`);
    }
    //console.log(`[OpenAI] System prompt: ${systemPrompt}`);

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...conversationHistory,
      { role: "user" as const, content: userMessage },
    ];
    console.log('[OpenAI] Conversation history:');
    messages.forEach(msg => {
        if (msg.role !== 'system') {
            console.log(`${msg.role}: ${msg.content}`);
        }
    });
    const stream = await openai.chat.completions.create({
      model,
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
                      enum: [
                        "text",
                        "card",
                        "menu",
                        "image",
                        "quickReplies",
                        "form",
                      ],
                    },
                    content: {
                      type: "string",
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
                              payload: {},
                            },
                            required: ["id", "text", "action"],
                          },
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
                              payload: {},
                            },
                            required: ["id", "text", "action"],
                          },
                        },
                        quickReplies: {
                          type: "array",
                          items: { type: "string" },
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
                                enum: ["text", "email", "textarea"],
                              },
                              placeholder: { type: "string" },
                              required: { type: "boolean" },
                              value: { type: "string" },
                            },
                            required: ["id", "label", "type"],
                          },
                        },
                        submitButton: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            text: { type: "string" },
                            action: { type: "string" },
                            payload: {},
                          },
                          required: ["id", "text", "action"],
                        },
                      },
                    },
                  },
                  required: ["messageType", "content"],
                },
              },
            },
            required: ["bubbles"],
          },
        },
      },
      temperature,
      max_tokens: maxTokens,
    });

    let accumulatedContent = "";
    let processedBubbles = 0;
    let lastBubbleTime = 0;
    const BUBBLE_DELAY_MS = 1000; // 500ms delay between bubbles

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
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
          if (
            parseResult.bubbles &&
            Array.isArray(parseResult.bubbles) &&
            jsonEnded
          ) {
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
                  if (
                    processedBubbles > 0 &&
                    timeSinceLastBubble < BUBBLE_DELAY_MS
                  ) {
                    const remainingDelay =
                      BUBBLE_DELAY_MS - timeSinceLastBubble;
                    await new Promise((resolve) =>
                      setTimeout(resolve, remainingDelay),
                    );
                  }

                  lastBubbleTime = Date.now();
                  return true;
                };

                if (bubble.messageType === "menu") {
                  if (
                    bubble.metadata?.options &&
                    Array.isArray(bubble.metadata.options) &&
                    bubble.metadata.options.length > 0
                  ) {
                    // Check if all options have required fields
                    const allOptionsComplete = bubble.metadata.options.every(
                      (opt: any) => opt.id && opt.text && opt.action,
                    );
                    if (allOptionsComplete) {
                      console.log(
                        `[OpenAI] Streaming bubble ${i + 1}: ${bubble.messageType} (menu with ${bubble.metadata.options.length} options)`,
                      );
                      await shouldYieldBubble();
                      yield { type: "bubble", bubble };
                      processedBubbles = i + 1;
                    }
                  }
                } else if (bubble.messageType === "form") {
                  // For form bubbles, ensure all required form fields are complete
                  if (
                    bubble.metadata?.formFields &&
                    Array.isArray(bubble.metadata.formFields) &&
                    bubble.metadata.formFields.length > 0
                  ) {
                    // Check if all form fields have required properties
                    const allFieldsComplete = bubble.metadata.formFields.every(
                      (field: any) => field && field.id && field.label && field.type,
                    );
                    if (allFieldsComplete) {
                      console.log(
                        `[OpenAI] Streaming bubble ${i + 1}: ${bubble.messageType} (form with ${bubble.metadata.formFields.length} fields)`,
                      );
                      await shouldYieldBubble();
                      yield { type: "bubble", bubble };
                      processedBubbles = i + 1;
                    }
                  }
                } else if (bubble.messageType === "text") {
                  // For text bubbles, ensure content is not just empty string
                  if (bubble.content && bubble.content.trim().length > 0) {
                    console.log(
                      `[OpenAI] Streaming bubble ${i + 1}: ${bubble.messageType} - "${bubble.content}"`,
                    );
                    await shouldYieldBubble();
                    yield { type: "bubble", bubble };
                    processedBubbles = i + 1;
                  }
                } else {
                  // For other types (card, image, quickReplies), just check basic completion
                  console.log(
                    `[OpenAI] Streaming bubble ${i + 1}: ${bubble.messageType} - "${bubble.content}"`,
                  );
                  await shouldYieldBubble();
                  yield { type: "bubble", bubble };
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
      console.log(
        `[OpenAI] Final accumulated content length: ${accumulatedContent.length}, content: ${accumulatedContent}`,
      );
      const finalParseResult = JSON.parse(accumulatedContent);
      console.log(`[OpenAI] Final parse successful, validating schema...`);

      const validated = AIResponseSchema.parse(finalParseResult);

      // Yield any remaining bubbles that weren't processed during streaming
      for (let i = processedBubbles; i < validated.bubbles.length; i++) {
        const bubble = validated.bubbles[i];
        console.log(`[OpenAI] Final bubble ${i + 1}: ${bubble.messageType}`);

        // Apply delay for remaining bubbles too
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
      console.error("[OpenAI] Accumulated content:", accumulatedContent);
      
      // Try to salvage the response by wrapping it in bubbles array if it's a valid single message
      try {
        const singleMessage = JSON.parse(accumulatedContent);
        if (singleMessage.messageType && singleMessage.content !== undefined) {
          console.log("[OpenAI] Attempting to salvage single message response by wrapping in bubbles array");
          const salvaged = {
            bubbles: [singleMessage]
          };
          const validated = AIResponseSchema.parse(salvaged);
          
          for (let i = processedBubbles; i < validated.bubbles.length; i++) {
            const bubble = validated.bubbles[i];
            console.log(`[OpenAI] Salvaged bubble ${i + 1}: ${bubble.messageType}`);
            yield { type: "bubble", bubble };
          }
          
          console.log("[OpenAI] Successfully salvaged response");
          yield { type: "complete", content: "streaming_complete" };
          return;
        }
      } catch (salvageError) {
        console.log("[OpenAI] Could not salvage response, using fallback");
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
      content:
        "I apologize, but I'm having trouble generating a response right now. Please try again.",
      messageType: "text",
    };
  }
}

// Legacy compatibility function
export async function generateStructuredResponse(
  userMessage: string,
  sessionId: string,
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }> = [],
  chatbotConfig?: any,
): Promise<AIResponse> {
  return generateMultiBubbleResponse(
    userMessage,
    sessionId,
    conversationHistory,
    chatbotConfig,
  );
}

export async function generateOptionResponse(
  optionId: string,
  payload: any,
  sessionId: string,
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }> = [],
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

// Helper function removed - no longer storing textual descriptions of menu options