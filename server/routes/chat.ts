import type { Express } from "express";
import { storage } from "../storage";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { generateStreamingResponse } from "../openai";
import { buildSurveyContext } from "../ai-response-schema";
import { brevoEmailService, FormSubmissionData } from "../email-service";
import { isAuthenticated } from "../replitAuth";

// Chat-related routes
export function setupChatRoutes(app: Express) {
  // Select option route (required for menu option interactions)
  app.post("/api/chat/:sessionId/select-option", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { optionId, payload, optionText } = req.body;

      console.log(
        `[SELECT_OPTION] Session: ${sessionId}, Option: ${optionId}, Text: ${optionText}`,
      );

      // Check if there's an active survey session and record the response
      let surveyResponseRecorded = false;
      try {
        const surveySession = await storage.getActiveSurveySession(sessionId);
        console.log(
          `[SURVEY RESPONSE] Active survey session check:`,
          surveySession
            ? {
                id: surveySession.id,
                surveyId: surveySession.surveyId,
                status: surveySession.status,
                currentQuestionIndex: surveySession.currentQuestionIndex,
              }
            : null,
        );

        if (surveySession && surveySession.status === "active") {
          // Get the survey to find the current question
          const survey = await storage.getSurvey(surveySession.surveyId);
          const surveyConfig = survey?.surveyConfig as any;
          if (survey && surveyConfig?.questions) {
            const questionIndex = surveySession.currentQuestionIndex || 0;
            const currentQuestion = surveyConfig.questions[questionIndex];

            if (currentQuestion) {
              console.log(
                `[SURVEY RESPONSE] Recording response for question: ${currentQuestion.text}`,
              );
              console.log(
                `[SURVEY RESPONSE] Option selected: ${optionId} - ${optionText}`,
              );

              // Record the survey response
              const questionId = `question_${surveySession.currentQuestionIndex}`;
              const response = optionText || optionId;

              const currentResponses = surveySession.responses && typeof surveySession.responses === 'object'
                ? surveySession.responses as Record<string, any>
                : {};
              const updatedResponses = {
                ...currentResponses,
                [`q${surveySession.currentQuestionIndex || 0}`]: payload || optionId
              };

              const updatedSession = await storage.updateSurveySession(
                surveySession.id,
                {
                  responses: updatedResponses,
                  currentQuestionIndex: (surveySession.currentQuestionIndex || 0) + 1,
                }
              );

              console.log(
                `[SURVEY RESPONSE] Successfully recorded survey response and advanced to question ${(updatedSession?.currentQuestionIndex || 0) + 1}`,
                { optionId, payload, surveyId: surveySession.surveyId }
              );
              surveyResponseRecorded = true;
            }
          }
        }
      } catch (surveyError) {
        console.error(
          `[SURVEY RESPONSE] Error recording survey response:`,
          surveyError,
        );
        // Continue with normal response even if survey recording fails
      }

      res.json({
        success: true,
        optionId,
        payload,
        optionText,
        surveyResponseRecorded,
        message: "Option selected successfully",
      });
    } catch (error) {
      console.error("Error selecting option:", error);
      res.status(500).json({
        error: "Failed to select option",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get chat session messages
  app.get("/api/chat/:sessionId/messages", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getRecentMessages(sessionId, 50);
      res.json({
        messages: messages, // Already ordered by createdAt (oldest first)
        sessionId,
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get conversation count for user's chatbots
  app.get(
    "/api/chat/conversations/count",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const fullUserId = req.user.claims.sub;
        const userId = fullUserId.includes("|")
          ? fullUserId.split("|")[1]
          : fullUserId;
        const conversationCount = await storage.getConversationCount(userId);
        res.json(conversationCount);
      } catch (error) {
        console.error("Error fetching conversation count:", error);
        res.status(500).json({ message: "Failed to fetch conversation count" });
      }
    },
  );

  // Get chat sessions for a specific chatbot (authenticated)
  app.get(
    "/api/chatbots/:guid/sessions",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { guid } = req.params;
        const fullUserId = req.user.claims.sub;
        const userId = fullUserId.includes("|")
          ? fullUserId.split("|")[1]
          : fullUserId;

        // Verify the chatbot belongs to the authenticated user
        const chatbotConfig = await storage.getChatbotConfigByGuid(
          userId,
          guid,
        );
        if (!chatbotConfig) {
          return res
            .status(404)
            .json({ message: "Chatbot not found or access denied" });
        }

        // Get all chat sessions for this chatbot
        const sessions = await storage.getChatSessionsByChatbotGuid(guid);

        // Add message count for each session
        const sessionsWithCounts = await Promise.all(
          sessions.map(async (session) => {
            const messages = await storage.getMessages(session.sessionId);
            return {
              ...session,
              messageCount: messages.length,
              lastMessageAt:
                messages.length > 0
                  ? messages[messages.length - 1].createdAt
                  : session.createdAt,
            };
          }),
        );

        res.json({
          sessions: sessionsWithCounts,
          chatbotName: chatbotConfig.name,
        });
      } catch (error) {
        console.error("Error fetching chatbot sessions:", error);
        res.status(500).json({ message: "Failed to fetch chatbot sessions" });
      }
    },
  );

  // Delete individual chat session
  app.delete("/api/chat/:sessionId", isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const fullUserId = req.user.claims.sub;
      const userId = fullUserId.includes("|")
        ? fullUserId.split("|")[1]
        : fullUserId;

      // Verify the session exists and belongs to a chatbot owned by the user
      const session = await storage.getChatSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Chat session not found" });
      }

      if (session.chatbotConfigId) {
        const chatbotConfig = await storage.getChatbotConfig(
          session.chatbotConfigId,
        );
        if (!chatbotConfig || chatbotConfig.userId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      await storage.deleteChatSession(sessionId);
      res.json({ message: "Chat session deleted successfully" });
    } catch (error) {
      console.error("Error deleting chat session:", error);
      res.status(500).json({ message: "Failed to delete chat session" });
    }
  });

  // Delete all chat sessions for a chatbot
  app.delete(
    "/api/chatbots/:guid/sessions",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { guid } = req.params;
        const fullUserId = req.user.claims.sub;
        const userId = fullUserId.includes("|")
          ? fullUserId.split("|")[1]
          : fullUserId;

        // Verify the chatbot belongs to the authenticated user
        const chatbotConfig = await storage.getChatbotConfigByGuid(
          userId,
          guid,
        );
        if (!chatbotConfig) {
          return res
            .status(404)
            .json({ message: "Chatbot not found or access denied" });
        }

        await storage.deleteAllChatSessions(chatbotConfig.id);
        res.json({ message: "All chat sessions deleted successfully" });
      } catch (error) {
        console.error("Error deleting all chat sessions:", error);
        res.status(500).json({ message: "Failed to delete all chat sessions" });
      }
    },
  );

  // Create new chat session
  app.post("/api/chat/session", async (req, res) => {
    try {
      const body = req.body;
      const { sessionId, chatbotConfigId } = body;

      // Ensure session exists
      let session = await storage.getChatSession(sessionId);
      if (!session) {
        session = await storage.createChatSession({
          sessionId,
          chatbotConfigId: chatbotConfigId || null,
        });
      }

      res.json({ session });
    } catch (error) {
      console.error("Error creating chat session:", error);
      res.status(500).json({ message: "Failed to create chat session" });
    }
  });

  // Send message with streaming response
  app.post("/api/chat/:sessionId/messages/stream", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { content, chatbotConfigId, internalMessage } = req.body;

      const messageData = insertMessageSchema.parse({
        sessionId,
        content,
        sender: "user" as const,
        messageType: "text" as const,
        metadata: {},
      });

      // Set up SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

      // Ensure session exists and handle default chatbot resolution
      let session = await storage.getChatSession(sessionId);
      if (!session) {
        session = await storage.createChatSession({
          sessionId,
          chatbotConfigId: chatbotConfigId || null,
        });
      } else if (
        chatbotConfigId &&
        session.chatbotConfigId !== chatbotConfigId
      ) {
        session = await storage.updateChatSession(sessionId, {
          chatbotConfigId: chatbotConfigId,
        });
      } else if (!session.chatbotConfigId && !chatbotConfigId) {
        // For default chatbot sessions, resolve and store the config ID
        const defaultGuid = process.env.DEFAULT_SITE_CHATBOT_GUID;
        const defaultUserId = process.env.DEFAULT_SITE_ADMIN_USER_ID;

        if (defaultGuid && defaultUserId) {
          const defaultConfig = await storage.getChatbotConfigByGuid(
            defaultUserId,
            defaultGuid,
          );
          if (defaultConfig) {
            session = await storage.updateChatSession(sessionId, {
              chatbotConfigId: defaultConfig.id,
            });
            console.log(
              `[SESSION] Updated session with default chatbot config ID: ${defaultConfig.id}`,
            );
          }
        }
      }

      // Create user message
      const userMessage = await storage.createMessage(messageData);

      // Send user message confirmation
      res.write(
        `data: ${JSON.stringify({
          type: "user_message",
          message: userMessage,
        })}\n\n`,
      );

      // Check message limits before generating AI response
      const currentChatbotConfigId =
        chatbotConfigId || session?.chatbotConfigId;
      if (currentChatbotConfigId) {
        const chatbotConfig = await storage.getChatbotConfig(
          currentChatbotConfigId,
        );
        if (chatbotConfig) {
          // Check if the chatbot owner has exceeded their message limit
          const canSendMessage = await storage.checkMessageLimit(
            chatbotConfig.userId,
          );

          if (!canSendMessage) {
            console.log(
              `[LIMIT] Message limit exceeded for user ${chatbotConfig.userId}`,
            );

            // Use the chatbot's configured fallback message or a default
            const limitMessage =
              chatbotConfig.fallbackMessage ||
              "I'm temporarily unavailable due to high usage. Please try again later or leave your contact details and we'll reach out to you.";

            // Send limit exceeded event with read-only mode and fallback message
            res.write(
              `data: ${JSON.stringify({
                type: "limit_exceeded",
                message: limitMessage,
                readOnlyMode: true,
                showContactForm: !!chatbotConfig.formRecipientEmail,
                chatbotConfig: {
                  name: chatbotConfig.name,
                  fallbackMessage: chatbotConfig.fallbackMessage,
                },
              })}\n\n`,
            );

            res.end();
            return;
          } else {
            // Increment message usage for successful requests
            await storage.incrementMessageUsage(chatbotConfig.userId);
          }
        } else {
          // Could not find chatbot config - return error to prevent bypass
          console.warn(
            `[LIMIT] Could not find chatbot config ${currentChatbotConfigId}, denying request`,
          );
          res.write(
            `data: ${JSON.stringify({
              type: "limit_exceeded",
              message:
                "Chat service is temporarily unavailable. Please try again later.",
              readOnlyMode: true,
              showContactForm: false,
            })}\n\n`,
          );
          res.end();
          return;
        }
      } else {
        // No chatbot config ID available - check against default admin user or deny
        const defaultUserId = process.env.DEFAULT_SITE_ADMIN_USER_ID;
        if (defaultUserId) {
          const canSendMessage = await storage.checkMessageLimit(defaultUserId);
          if (!canSendMessage) {
            console.log(
              `[LIMIT] Message limit exceeded for default user ${defaultUserId}`,
            );
            res.write(
              `data: ${JSON.stringify({
                type: "limit_exceeded",
                message:
                  "Chat service is temporarily unavailable due to high usage. Please try again later.",
                readOnlyMode: true,
                showContactForm: false,
              })}\n\n`,
            );
            res.end();
            return;
          } else {
            await storage.incrementMessageUsage(defaultUserId);
          }
        } else {
          // No default user configured - deny request to prevent bypass
          console.warn(
            `[LIMIT] No chatbot config or default user, denying request`,
          );
          res.write(
            `data: ${JSON.stringify({
              type: "limit_exceeded",
              message:
                "Chat service is temporarily unavailable. Please try again later.",
              readOnlyMode: true,
              showContactForm: false,
            })}\n\n`,
          );
          res.end();
          return;
        }
      }

      // Handle survey session creation for survey requests
      try {
        await handleSurveySessionCreation(
          sessionId,
          internalMessage || messageData.content,
          chatbotConfigId || session?.chatbotConfigId || undefined,
          session,
        );
      } catch (surveyError) {
        console.error(
          `[SURVEY] Error in survey session creation:`,
          surveyError,
        );
        // Continue with normal response even if survey creation fails
      }

      // Generate streaming response
      await handleStreamingResponse(
        internalMessage || messageData.content,
        sessionId,
        res,
        chatbotConfigId || session?.chatbotConfigId || undefined,
      );
    } catch (error) {
      console.error("Error in streaming message:", error);
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          message: "Internal server error",
        })}\n\n`,
      );
      res.end();
    }
  });

  // Form submission route - handles form data and sends email via Brevo
  app.post("/api/chat/:sessionId/submit-form", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { formData, formTitle } = req.body;

      console.log(
        `[FORM_SUBMISSION] Processing form submission for session: ${sessionId}`,
      );

      // Validate required fields
      if (!formData || !Array.isArray(formData)) {
        return res.status(400).json({
          success: false,
          error: "Form data is required and must be an array",
        });
      }

      // Get chatbot configuration for email settings
      const session = await storage.getChatSession(sessionId);
      let chatbotConfig;
      let chatbotName = "Chat Assistant";
      let recipientEmail: string | null = null;
      let recipientName = "Support Team";
      let confirmationMessage =
        "Thank you! Your message has been sent successfully. We will contact you soon.";

      // Use environment variables or safe defaults for sender information
      const senderEmail =
        process.env.BREVO_SENDER_EMAIL || "noreply@bottailor.com";
      const senderName = process.env.BREVO_SENDER_NAME || "Chat Assistant";

      if (session?.chatbotConfigId) {
        chatbotConfig = await storage.getChatbotConfig(session.chatbotConfigId);
        chatbotName = chatbotConfig?.name || "Chat Assistant";

        // Only use configured recipient email (no fallbacks for security)
        if (chatbotConfig?.formRecipientEmail) {
          recipientEmail = chatbotConfig.formRecipientEmail;
        }
        if (chatbotConfig?.formRecipientName) {
          recipientName = chatbotConfig.formRecipientName;
        }
        if (chatbotConfig?.formConfirmationMessage) {
          confirmationMessage = chatbotConfig.formConfirmationMessage;
        }
      }

      // Security check: Ensure recipient email is configured
      if (!recipientEmail) {
        console.warn(
          `[FORM_SUBMISSION] No recipient email configured for session: ${sessionId}`,
        );
        return res.status(400).json({
          success: false,
          error:
            "Contact form is not available - no recipient email configured",
        });
      }

      // Prepare form submission data
      const submissionData: FormSubmissionData = {
        sessionId,
        formFields: formData.map((field) => ({
          id: field.id || "unknown",
          label: field.label || "Unnamed Field",
          type: field.type || "text",
          value: field.value || "",
        })),
        metadata: {
          title: formTitle || "Contact Form Submission",
          chatbotName,
        },
      };

      // Store form submission as a message in the chat
      await storage.createMessage({
        sessionId,
        content: `Form submitted with ${formData.length} fields`,
        sender: "user",
        messageType: "form_submission",
        metadata: {
          formData: submissionData.formFields,
          submittedAt: new Date().toISOString(),
        },
      });

      // Send email via Brevo
      const emailResult = await brevoEmailService.sendFormSubmission(
        submissionData,
        recipientEmail,
        recipientName,
        senderEmail,
        senderName,
      );

      if (emailResult.success) {
        console.log(
          `[FORM_SUBMISSION] Email sent successfully: ${emailResult.messageId}`,
        );

        // Send confirmation message to chat
        await storage.createMessage({
          sessionId,
          content: confirmationMessage,
          sender: "bot",
          messageType: "text",
          metadata: {
            emailSent: true,
            messageId: emailResult.messageId,
          },
        });

        res.json({
          success: true,
          message: "Form submitted and email sent successfully",
          messageId: emailResult.messageId,
        });
      } else {
        console.error(`[FORM_SUBMISSION] Email failed: ${emailResult.error}`);

        // Send error message to chat
        await storage.createMessage({
          sessionId,
          content:
            "Viestisi vastaanotettiin, mutta sähköposti-ilmoituksen lähettämisessä oli ongelma. Yritä uudelleen tai ota yhteyttä tukeen.",
          sender: "bot",
          messageType: "text",
          metadata: {
            emailSent: false,
            error: emailResult.error,
          },
        });

        res.status(500).json({
          success: false,
          message: "Form submitted but email delivery failed",
          error: emailResult.error,
        });
      }
    } catch (error) {
      console.error(
        "[FORM_SUBMISSION] Error processing form submission:",
        error,
      );
      res.status(500).json({
        success: false,
        error: "Failed to process form submission",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}

// HTTP streaming handler that uses the generator
async function handleStreamingResponse(
  userMessage: string,
  sessionId: string,
  res: any,
  chatbotConfigId?: string,
) {
  try {
    console.log(
      `[STREAMING] Starting streaming response for session: ${sessionId}`,
    );

    // Get chatbot configuration
    let chatbotConfig;
    if (chatbotConfigId) {
        const configId = typeof chatbotConfigId === 'string' ? parseInt(chatbotConfigId) : chatbotConfigId;
        chatbotConfig = await storage.getChatbotConfig(configId);
        console.log(
          `[STREAMING] Using chatbot config: ${chatbotConfig?.name || "Unknown"}`,
        );
      } else {
        console.log(`[STREAMING] No chatbot config ID provided`);
      }

    // Get conversation history
    const conversationHistory = await storage.getMessages(sessionId);
    const formattedHistory = conversationHistory
      .filter((msg) => msg.sender !== "bot" || msg.content.trim() !== "")
      .map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content:
          msg.sender === "bot" && msg.metadata && typeof msg.metadata === 'object' && 'originalContent' in msg.metadata
            ? getTextualRepresentation(msg)
            : msg.content,
      })) as Array<{ role: "user" | "assistant"; content: string }>;

    // Use the streaming generator
    const responseStream = generateStreamingResponse(
      userMessage,
      sessionId,
      formattedHistory,
      chatbotConfig,
    );

    // Process the stream
    for await (const chunk of responseStream) {
      if (chunk.type === "bubble" && chunk.bubble) {
        console.log(`[STREAMING] Sending bubble: ${chunk.bubble.messageType}`);

        // Store the bot message in database
        await storage.createMessage({
          sessionId,
          content: chunk.bubble.content,
          sender: "bot",
          messageType: chunk.bubble.messageType,
          metadata: {
            ...chunk.bubble.metadata,
            originalContent: chunk.bubble,
          },
        });

        // Send to client
        res.write(
          `data: ${JSON.stringify({
            type: "bubble",
            message: chunk.bubble,
          })}\n\n`,
        );
      } else if (chunk.type === "complete") {
        console.log(`[STREAMING] Streaming complete for session: ${sessionId}`);
        res.write(
          `data: ${JSON.stringify({
            type: "complete",
            message: "Stream finished",
          })}\n\n`,
        );
        res.end();
        return;
      }
    }
  } catch (error) {
    console.error(`[STREAMING] Error in handleStreamingResponse:`, error);
    res.write(
      `data: ${JSON.stringify({
        type: "error",
        message: "Internal server error",
      })}\n\n`,
    );
    res.end();
  }
}

// Helper function for textual representation of rich messages
function getTextualRepresentation(msg: any): string {
  if (!msg.metadata?.originalContent) return msg.content;

  const original = msg.metadata.originalContent;

  switch (original.messageType) {
    case "menu":
      const options =
        original.metadata?.options?.map((opt: any) => opt.text).join(", ") ||
        "";
      return `[MENU] Presented options: ${options}`;
    case "quickReplies":
      const replies = original.metadata?.quickReplies?.join(", ") || "";
      return `[QUICKREPLIES] Suggested replies: ${replies}`;
    case "form":
      const fields =
        original.metadata?.formFields
          ?.map((field: any) => field.label)
          .join(", ") || "";
      return `[FORM] Form with fields: ${fields}`;
    case "card":
      return `[CARD] ${original.metadata?.title || original.content}`;
    default:
      return original.content;
  }
}

async function handleSurveySessionCreation(
  sessionId: string,
  messageContent: string,
  chatbotConfigId?: string,
  session?: any,
) {
  console.log(
    `[SURVEY] Checking if message is survey request: "${messageContent}"`,
  );

  if (
    messageContent.toLowerCase().includes("assessment") ||
    messageContent.toLowerCase().includes("survey") ||
    messageContent.toLowerCase().includes("arviointi")
  ) {
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
        const defaultConfig = await storage.getChatbotConfigByGuid(
          defaultUserId,
          defaultGuid,
        );
        if (defaultConfig) {
          configId = defaultConfig.id;
          console.log(
            `[SURVEY] Using default chatbot for survey operations: ${defaultConfig.name} (ID: ${configId})`,
          );
        }
      }
    }

    if (configId) {
      const chatbotConfig = await storage.getChatbotConfig(configId);
      if (chatbotConfig) {
        const availableSurveys = await storage.getSurveys(configId);
        console.log(
          `[SURVEY] Found ${availableSurveys.length} available surveys`,
        );

        if (availableSurveys.length > 0) {
          // Find target survey first
          let targetSurvey;
          if (targetSurveyId) {
            targetSurvey = availableSurveys.find(
              (s) => s.id === targetSurveyId,
            );
            if (!targetSurvey) {
              console.log(
                `[SURVEY] WARNING: Requested surveyId ${targetSurveyId} not found, using first available`,
              );
              targetSurvey = availableSurveys[0];
            }
          } else {
            targetSurvey = availableSurveys[0];
          }

          // First deactivate any existing active survey sessions
          await storage.deactivateAllSurveySessions(sessionId);

          // Check for existing survey session for this specific survey
          const existingSurveySession = await storage.getSurveySession(
            targetSurvey.id,
            sessionId,
          );

          if (existingSurveySession) {
            if (existingSurveySession.status === "completed") {
              console.log(
                `[SURVEY] User has already completed survey ${targetSurvey.id}, offering retake`,
              );
              // Update existing session to restart the survey
              await storage.updateSurveySession(existingSurveySession.id, {
                currentQuestionIndex: 0,
                responses: {},
                status: "active",
              });
            } else {
              console.log(
                `[SURVEY] Reactivating existing survey session for survey ${targetSurvey.id}`,
              );
              // Reactivate the survey session (it was deactivated above)
              await storage.updateSurveySession(existingSurveySession.id, {
                status: "active",
              });
            }
            // Set this survey as active
            await storage.setActiveSurvey(sessionId, targetSurvey.id);
            console.log(
              `[SURVEY] Set survey ${targetSurvey.id} as active for session ${sessionId}`,
            );
            console.log(
              `[SURVEY] Survey session status updated for survey: ${(targetSurvey.surveyConfig as any)?.title || targetSurvey.name}`,
            );
          } else {
            // No existing session, create a new one
            console.log(
              `[SURVEY] Creating new survey session for survey: ${(targetSurvey.surveyConfig as any)?.title || targetSurvey.name || "Unknown Survey"}`,
            );

            try {
              const newSurveySession = await storage.createSurveySession({
                surveyId: targetSurvey.id,
                sessionId,
                currentQuestionIndex: 0,
                responses: {},
                status: "active",
              });

              // Set this survey as active in the chat session
              await storage.setActiveSurvey(sessionId, targetSurvey.id);

              console.log(
                `[SURVEY] Successfully created survey session and set as active:`,
                {
                  id: newSurveySession.id,
                  surveyId: newSurveySession.surveyId,
                  sessionId: newSurveySession.sessionId,
                },
              );
            } catch (error) {
              console.error(`[SURVEY] Error creating survey session:`, error);
            }
          }
        }
      }
    }
  }
}