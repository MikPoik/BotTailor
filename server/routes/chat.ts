import type { Express } from "express";
import { storage } from "../storage";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { generateStreamingResponse } from "../openai-service";
import { buildSurveyContext } from "../ai-response-schema";

// Chat-related routes
export function setupChatRoutes(app: Express) {
  // Select option route (required for menu option interactions)
  app.post('/api/chat/:sessionId/select-option', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { optionId, payload, optionText } = req.body;
      
      console.log(`[SELECT_OPTION] Session: ${sessionId}, Option: ${optionId}, Text: ${optionText}`);
      
      // Check if there's an active survey session and record the response
      let surveyResponseRecorded = false;
      try {
        const surveySession = await storage.getSurveySessionBySessionId(sessionId);
        console.log(`[SURVEY RESPONSE] Survey session check:`, surveySession ? {
          id: surveySession.id,
          surveyId: surveySession.surveyId,
          status: surveySession.status,
          currentQuestionIndex: surveySession.currentQuestionIndex
        } : null);

        if (surveySession && surveySession.status === 'active') {
          // Get the survey to find the current question
          const survey = await storage.getSurvey(surveySession.surveyId);
          if (survey && survey.surveyConfig?.questions) {
            const currentQuestion = survey.surveyConfig.questions[surveySession.currentQuestionIndex];
            
            if (currentQuestion) {
              console.log(`[SURVEY RESPONSE] Recording response for question: ${currentQuestion.text}`);
              console.log(`[SURVEY RESPONSE] Option selected: ${optionId} - ${optionText}`);
              
              // Record the survey response
              const questionId = `question_${surveySession.currentQuestionIndex}`;
              const response = optionText || optionId;
              
              const updatedResponses = { ...surveySession.responses, [questionId]: response };
              
              const updatedSession = await storage.updateSurveySession(surveySession.id, {
                responses: updatedResponses,
                currentQuestionIndex: surveySession.currentQuestionIndex + 1
              });
              
              console.log(`[SURVEY RESPONSE] Successfully recorded survey response and advanced to question ${updatedSession.currentQuestionIndex + 1}`);
              surveyResponseRecorded = true;
            }
          }
        }
      } catch (surveyError) {
        console.error(`[SURVEY RESPONSE] Error recording survey response:`, surveyError);
        // Continue with normal response even if survey recording fails
      }
      
      res.json({ 
        success: true, 
        optionId, 
        payload, 
        optionText,
        surveyResponseRecorded,
        message: "Option selected successfully" 
      });
    } catch (error) {
      console.error("Error selecting option:", error);
      res.status(500).json({ 
        error: "Failed to select option", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get chat session messages
  app.get('/api/chat/:sessionId/messages', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getRecentMessages(sessionId, 50);
      res.json({
        messages: messages.reverse(), // Reverse to show oldest first
        sessionId
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Create new chat session
  app.post('/api/chat/session', async (req, res) => {
    try {
      const body = req.body;
      const { sessionId, chatbotConfigId } = body;

      // Ensure session exists
      let session = await storage.getChatSession(sessionId);
      if (!session) {
        session = await storage.createChatSession({ 
          sessionId,
          chatbotConfigId: chatbotConfigId || null
        });
      }

      res.json({ session });
    } catch (error) {
      console.error("Error creating chat session:", error);
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  // Send message with streaming response
  app.post('/api/chat/:sessionId/messages/stream', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { content, chatbotConfigId, internalMessage } = req.body;
      
      const messageData = insertMessageSchema.parse({
        sessionId,
        content,
        sender: "user" as const,
        messageType: "text" as const,
        metadata: {}
      });

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

      // Ensure session exists and handle default chatbot resolution
      let session = await storage.getChatSession(sessionId);
      if (!session) {
        session = await storage.createChatSession({ 
          sessionId,
          chatbotConfigId: chatbotConfigId || null
        });
      } else if (chatbotConfigId && session.chatbotConfigId !== chatbotConfigId) {
        session = await storage.updateChatSession(sessionId, { 
          chatbotConfigId: chatbotConfigId 
        });
      } else if (!session.chatbotConfigId && !chatbotConfigId) {
        // For default chatbot sessions, resolve and store the config ID
        const defaultGuid = process.env.DEFAULT_SITE_CHATBOT_GUID;
        const defaultUserId = process.env.DEFAULT_SITE_ADMIN_USER_ID;
        
        if (defaultGuid && defaultUserId) {
          const defaultConfig = await storage.getChatbotConfigByGuid(defaultUserId, defaultGuid);
          if (defaultConfig) {
            session = await storage.updateChatSession(sessionId, { 
              chatbotConfigId: defaultConfig.id 
            });
            console.log(`[SESSION] Updated session with default chatbot config ID: ${defaultConfig.id}`);
          }
        }
      }

      // Create user message
      const userMessage = await storage.createMessage(messageData);

      // Send user message confirmation
      res.write(`data: ${JSON.stringify({ 
        type: 'user_message', 
        message: userMessage 
      })}\n\n`);

      // Handle survey session creation for survey requests
      try {
        await handleSurveySessionCreation(sessionId, internalMessage || messageData.content, chatbotConfigId, session);
      } catch (surveyError) {
        console.error(`[SURVEY] Error in survey session creation:`, surveyError);
        // Continue with normal response even if survey creation fails
      }

      // Generate streaming response
      await handleStreamingResponse(
        internalMessage || messageData.content,
        sessionId,
        res,
        chatbotConfigId || session?.chatbotConfigId || undefined
      );

    } catch (error) {
      console.error("Error in streaming message:", error);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: 'Internal server error' 
      })}\n\n`);
      res.end();
    }
  });
}

// HTTP streaming handler that uses the generator
async function handleStreamingResponse(
  userMessage: string,
  sessionId: string,
  res: any,
  chatbotConfigId?: string
) {
  try {
    console.log(`[STREAMING] Starting streaming response for session: ${sessionId}`);
    
    // Get chatbot configuration
    let chatbotConfig;
    if (chatbotConfigId) {
      chatbotConfig = await storage.getChatbotConfig(chatbotConfigId);
      console.log(`[STREAMING] Using chatbot config: ${chatbotConfig?.name || 'Unknown'}`);
    } else {
      console.log(`[STREAMING] No chatbot config ID provided`);
    }
    
    // Get conversation history
    const conversationHistory = await storage.getMessages(sessionId);
    const formattedHistory = conversationHistory
      .filter(msg => msg.sender !== 'bot' || msg.content.trim() !== '')
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.sender === 'bot' && msg.metadata?.originalContent 
          ? getTextualRepresentation(msg)
          : msg.content
      })) as Array<{ role: "user" | "assistant"; content: string }>;
    
    // Use the streaming generator
    const responseStream = generateStreamingResponse(
      userMessage,
      sessionId,
      formattedHistory,
      chatbotConfig
    );
    
    // Process the stream
    for await (const chunk of responseStream) {
      if (chunk.type === 'bubble' && chunk.bubble) {
        console.log(`[STREAMING] Sending bubble: ${chunk.bubble.messageType}`);
        
        // Store the bot message in database
        await storage.createMessage({
          sessionId,
          content: chunk.bubble.content,
          sender: 'bot',
          messageType: chunk.bubble.messageType,
          metadata: {
            ...chunk.bubble.metadata,
            originalContent: chunk.bubble
          }
        });
        
        // Send to client
        res.write(`data: ${JSON.stringify({ 
          type: 'bubble', 
          message: chunk.bubble
        })}\n\n`);
      } else if (chunk.type === 'complete') {
        console.log(`[STREAMING] Streaming complete for session: ${sessionId}`);
        res.write(`data: ${JSON.stringify({ 
          type: 'complete', 
          message: 'Stream finished' 
        })}\n\n`);
        res.end();
        return;
      }
    }
    
  } catch (error) {
    console.error(`[STREAMING] Error in handleStreamingResponse:`, error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      message: 'Internal server error' 
    })}\n\n`);
    res.end();
  }
}

// Helper function for textual representation of rich messages
function getTextualRepresentation(msg: any): string {
  if (!msg.metadata?.originalContent) return msg.content;
  
  const original = msg.metadata.originalContent;
  
  switch (original.messageType) {
    case 'menu':
      const options = original.metadata?.options?.map((opt: any) => opt.text).join(', ') || '';
      return `[MENU] Presented options: ${options}`;
    case 'quickReplies':
      const replies = original.metadata?.quickReplies?.join(', ') || '';
      return `[QUICKREPLIES] Suggested replies: ${replies}`;
    case 'form':
      const fields = original.metadata?.formFields?.map((field: any) => field.label).join(', ') || '';
      return `[FORM] Form with fields: ${fields}`;
    case 'card':
      return `[CARD] ${original.metadata?.title || original.content}`;
    default:
      return original.content;
  }
}

async function handleSurveySessionCreation(
  sessionId: string, 
  messageContent: string, 
  chatbotConfigId?: string, 
  session?: any
) {
  console.log(`[SURVEY] Checking if message is survey request: "${messageContent}"`);
  
  if (messageContent.toLowerCase().includes('assessment') || 
      messageContent.toLowerCase().includes('survey') ||
      messageContent.toLowerCase().includes('arviointi')) {

    console.log(`[SURVEY] Detected survey request in message`);

    // Extract surveyId from message if present
    const surveyIdMatch = messageContent.match(/surveyId:\s*(\d+)/);
    let targetSurveyId = surveyIdMatch ? parseInt(surveyIdMatch[1]) : null;
    console.log(`[SURVEY] Extracted surveyId from message: ${targetSurveyId}`);

    // Get chatbot configuration
    let configId = chatbotConfigId || session?.chatbotConfigId;
    
    // If no config ID, try default chatbot
    if (!configId) {
      const defaultGuid = process.env.DEFAULT_SITE_CHATBOT_GUID;
      const defaultUserId = process.env.DEFAULT_SITE_ADMIN_USER_ID;
      
      if (defaultGuid && defaultUserId) {
        const defaultConfig = await storage.getChatbotConfigByGuid(defaultUserId, defaultGuid);
        if (defaultConfig) {
          configId = defaultConfig.id;
          console.log(`[SURVEY] Using default chatbot for survey operations: ${defaultConfig.name} (ID: ${configId})`);
        }
      }
    }

    if (configId) {
      const chatbotConfig = await storage.getChatbotConfig(configId);
      if (chatbotConfig) {
        const availableSurveys = await storage.getSurveys(configId);
        console.log(`[SURVEY] Found ${availableSurveys.length} available surveys`);

        if (availableSurveys.length > 0) {
          let existingSurveySession = await storage.getSurveySessionBySessionId(sessionId);

          if (!existingSurveySession || existingSurveySession.status !== 'active') {
            // Find target survey or use first available
            let targetSurvey;
            if (targetSurveyId) {
              targetSurvey = availableSurveys.find(s => s.id === targetSurveyId);
              if (!targetSurvey) {
                console.log(`[SURVEY] WARNING: Requested surveyId ${targetSurveyId} not found, using first available`);
                targetSurvey = availableSurveys[0];
              }
            } else {
              targetSurvey = availableSurveys[0];
            }
            
            console.log(`[SURVEY] Creating survey session for survey: ${targetSurvey.surveyConfig?.title || targetSurvey.name || 'Unknown Survey'}`);

            try {
              const newSurveySession = await storage.createSurveySession({
                surveyId: targetSurvey.id,
                sessionId,
                currentQuestionIndex: 0,
                responses: {},
                status: 'active'
              });
              
              console.log(`[SURVEY] Successfully created survey session:`, {
                id: newSurveySession.id,
                surveyId: newSurveySession.surveyId,
                sessionId: newSurveySession.sessionId
              });
            } catch (error) {
              console.error(`[SURVEY] Error creating survey session:`, error);
            }
          }
        }
      }
    }
  }
}