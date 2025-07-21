import type { Express } from "express";
import { storage } from "../storage";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { generateStreamingResponse } from "../openai-service";
import { buildSurveyContext } from "../ai-response-schema";

// Chat-related routes
export function setupChatRoutes(app: Express) {
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
      await handleSurveySessionCreation(sessionId, internalMessage || messageData.content, chatbotConfigId, session);

      // Generate streaming response
      await generateStreamingResponse(
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
            
            console.log(`[SURVEY] Creating survey session for survey: ${targetSurvey.surveyConfig?.title}`);

            await storage.createSurveySession({
              surveyId: targetSurvey.id,
              sessionId,
              currentQuestionIndex: 0,
              responses: {},
              status: 'active'
            });
          }
        }
      }
    }
  }
}