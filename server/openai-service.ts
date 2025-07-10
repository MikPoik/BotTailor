import OpenAI from "openai";
import { AIResponseSchema, SYSTEM_PROMPT, type AIResponse } from "./ai-response-schema";
import { parse } from "best-effort-json-parser";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to detect complete bubbles from incomplete JSON using brace matching
function detectCompleteBubbles(accumulatedContent: string, alreadyProcessed: number): any[] {
  const completeBubbles: any[] = [];
  
  // Look for the bubbles array start
  const bubblesStart = accumulatedContent.indexOf('"bubbles":[');
  if (bubblesStart === -1) {
    return completeBubbles;
  }
  
  // Find the start of the bubbles array content
  let searchStart = bubblesStart + '"bubbles":['.length;
  let bubbleCount = 0;
  
  // Skip already processed bubbles
  while (bubbleCount < alreadyProcessed) {
    const nextBubbleStart = accumulatedContent.indexOf('{', searchStart);
    if (nextBubbleStart === -1) break;
    
    const nextBubbleEnd = findMatchingBrace(accumulatedContent, nextBubbleStart);
    if (nextBubbleEnd === -1) break;
    
    searchStart = nextBubbleEnd + 1;
    bubbleCount++;
  }
  
  // Now look for new complete bubbles
  while (true) {
    const bubbleStart = accumulatedContent.indexOf('{', searchStart);
    if (bubbleStart === -1) break;
    
    const bubbleEnd = findMatchingBrace(accumulatedContent, bubbleStart);
    if (bubbleEnd === -1) {
      // Bubble is incomplete - check if we have a simple text bubble ending pattern
      const simpleTextPattern = /"content":"[^"]*"}/;
      const remainingContent = accumulatedContent.substring(bubbleStart);
      const simpleMatch = remainingContent.match(simpleTextPattern);
      
      if (simpleMatch) {
        // Try to extract up to the closing brace
        const possibleEnd = bubbleStart + simpleMatch.index + simpleMatch[0].length - 1;
        const candidateJson = accumulatedContent.substring(bubbleStart, possibleEnd + 1);
        
        try {
          const bubble = JSON.parse(candidateJson);
          if (bubble.messageType && bubble.content !== undefined) {
            console.log(`[DEBUG] Found complete ${bubble.messageType} bubble via pattern: "${bubble.content}"`);
            completeBubbles.push(bubble);
            searchStart = possibleEnd + 1;
            continue;
          }
        } catch (e) {
          // Pattern didn't work, bubble is truly incomplete
        }
      }
      break; // No more complete bubbles
    }
    
    // Extract the bubble JSON
    const bubbleJson = accumulatedContent.substring(bubbleStart, bubbleEnd + 1);
    
    try {
      const bubble = JSON.parse(bubbleJson);
      
      // Check if bubble is complete based on messageType
      if (bubble.messageType && bubble.content !== undefined) {
        if (bubble.messageType === 'menu') {
          // For menu type, check if metadata.options is complete
          if (bubble.metadata?.options && Array.isArray(bubble.metadata.options) && bubble.metadata.options.length > 0) {
            const allOptionsComplete = bubble.metadata.options.every(opt => 
              opt.id && opt.text && opt.action
            );
            if (allOptionsComplete) {
              console.log(`[DEBUG] Found complete menu bubble: ${bubble.content}`);
              completeBubbles.push(bubble);
            }
          }
        } else {
          // For text and other types, just check basic completion
          console.log(`[DEBUG] Found complete ${bubble.messageType} bubble: "${bubble.content}"`);
          completeBubbles.push(bubble);
        }
      }
    } catch (parseError) {
      // If we can't parse this bubble, it's incomplete
      console.log(`[DEBUG] Failed to parse bubble JSON: ${bubbleJson.substring(0, 50)}...`);
      break;
    }
    
    searchStart = bubbleEnd + 1;
  }
  
  return completeBubbles;
}

// Helper function to find matching closing brace
function findMatchingBrace(content: string, startPos: number): number {
  let braceCount = 0;
  let inString = false;
  let escapeNext = false;
  
  for (let i = startPos; i < content.length; i++) {
    const char = content[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          return i;
        }
      }
    }
  }
  
  return -1; // No matching brace found
}

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
        
        // Try to detect complete bubbles as they arrive
        const completeBubbles = detectCompleteBubbles(accumulatedContent, processedBubbles);
        
        if (completeBubbles.length > 0) {
          console.log(`[OpenAI] Found ${completeBubbles.length} complete bubbles during streaming`);
        }
        
        for (const bubble of completeBubbles) {
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