import type { Express } from "express";
import { storage } from "../storage";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { generateStreamingResponse } from "../openai-service";
import { buildSurveyContext } from "../ai-response-schema";
import { brevoEmailService, FormSubmissionData } from "../email-service";
import { isAuthenticated } from "../replitAuth";

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
        messages: messages, // Already ordered by createdAt (oldest first)
        sessionId
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get conversation count for user's chatbots
  app.get('/api/chat/conversations/count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationCount = await storage.getConversationCount(userId);
      res.json(conversationCount);
    } catch (error) {
      console.error("Error fetching conversation count:", error);
      res.status(500).json({ message: "Failed to fetch conversation count" });
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

  // Form submission route - handles form data and sends email via Brevo
  app.post('/api/chat/:sessionId/submit-form', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { formData, formTitle } = req.body;

      console.log(`[FORM_SUBMISSION] Processing form submission for session: ${sessionId}`);

      // Validate required fields
      if (!formData || !Array.isArray(formData)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Form data is required and must be an array' 
        });
      }

      // Get chatbot configuration for email settings
      const session = await storage.getChatSession(sessionId);
      let chatbotConfig;
      let chatbotName = 'Chat Assistant';
      let recipientEmail = 'admin@example.com'; // fallback
      let recipientName = 'Support Team'; // fallback
      let senderEmail = 'noreply@chatbot.com'; // fallback
      let senderName = 'Chat Assistant'; // fallback
      let confirmationMessage = 'Thank you! Your message has been sent successfully. We will contact you soon.'; // fallback
      
      if (session?.chatbotConfigId) {
        chatbotConfig = await storage.getChatbotConfig(session.chatbotConfigId);
        chatbotName = chatbotConfig?.name || 'Chat Assistant';
        
        // Use configured email settings if available
        if (chatbotConfig?.formRecipientEmail) {
          recipientEmail = chatbotConfig.formRecipientEmail;
        }
        if (chatbotConfig?.formRecipientName) {
          recipientName = chatbotConfig.formRecipientName;
        }
        if (chatbotConfig?.senderEmail) {
          senderEmail = chatbotConfig.senderEmail;
        }
        if (chatbotConfig?.senderName) {
          senderName = chatbotConfig.senderName;
        }
        if (chatbotConfig?.formConfirmationMessage) {
          confirmationMessage = chatbotConfig.formConfirmationMessage;
        }
      }

      // Prepare form submission data
      const submissionData: FormSubmissionData = {
        sessionId,
        formFields: formData.map(field => ({
          id: field.id || 'unknown',
          label: field.label || 'Unnamed Field',
          type: field.type || 'text',
          value: field.value || ''
        })),
        metadata: {
          title: formTitle || 'Contact Form Submission',
          chatbotName
        }
      };

      // Store form submission as a message in the chat
      await storage.createMessage({
        sessionId,
        content: `Form submitted with ${formData.length} fields`,
        sender: 'user',
        messageType: 'form_submission',
        metadata: {
          formData: submissionData.formFields,
          submittedAt: new Date().toISOString()
        }
      });

      // Send email via Brevo
      const emailResult = await brevoEmailService.sendFormSubmission(
        submissionData,
        recipientEmail,
        recipientName,
        senderEmail,
        senderName
      );

      if (emailResult.success) {
        console.log(`[FORM_SUBMISSION] Email sent successfully: ${emailResult.messageId}`);
        
        // Send confirmation message to chat
        await storage.createMessage({
          sessionId,
          content: confirmationMessage,
          sender: 'bot',
          messageType: 'text',
          metadata: {
            emailSent: true,
            messageId: emailResult.messageId
          }
        });

        res.json({
          success: true,
          message: 'Form submitted and email sent successfully',
          messageId: emailResult.messageId
        });
      } else {
        console.error(`[FORM_SUBMISSION] Email failed: ${emailResult.error}`);
        
        // Send error message to chat
        await storage.createMessage({
          sessionId,
          content: 'Viestisi vastaanotettiin, mutta sähköposti-ilmoituksen lähettämisessä oli ongelma. Yritä uudelleen tai ota yhteyttä tukeen.',
          sender: 'bot',
          messageType: 'text',
          metadata: {
            emailSent: false,
            error: emailResult.error
          }
        });

        res.status(500).json({
          success: false,
          message: 'Form submitted but email delivery failed',
          error: emailResult.error
        });
      }

    } catch (error) {
      console.error('[FORM_SUBMISSION] Error processing form submission:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process form submission',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
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
          // Find target survey first
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

          // Check for existing survey session for this specific survey
          const existingSurveySession = await storage.getSurveySession(targetSurvey.id, sessionId);
          
          if (existingSurveySession) {
            if (existingSurveySession.status === 'active') {
              console.log(`[SURVEY] Survey session already active for survey ${targetSurvey.id}, continuing with existing session`);
              // Continue with existing active session - no action needed
            } else if (existingSurveySession.status === 'completed') {
              console.log(`[SURVEY] User has already completed survey ${targetSurvey.id}, offering retake`);
              // Update existing session to restart the survey
              await storage.updateSurveySession(existingSurveySession.id, {
                currentQuestionIndex: 0,
                responses: {},
                status: 'active'
              });
              console.log(`[SURVEY] Restarted completed survey session for survey: ${targetSurvey.surveyConfig?.title || targetSurvey.name}`);
            }
          } else {
            // No existing session, create a new one
            console.log(`[SURVEY] Creating new survey session for survey: ${targetSurvey.surveyConfig?.title || targetSurvey.name || 'Unknown Survey'}`);

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