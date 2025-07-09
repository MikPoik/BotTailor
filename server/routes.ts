import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema, insertChatSessionSchema, RichMessageSchema } from "@shared/schema";
import { z } from "zod";
import { generateStructuredResponse, generateOptionResponse } from "./openai-service";

export async function registerRoutes(app: Express): Promise<Server> {

  // Create or get chat session
  app.post("/api/chat/session", async (req, res) => {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      let session = await storage.getChatSession(sessionId);

      if (!session) {
        session = await storage.createChatSession({ sessionId });

        // Send welcome message
        await storage.createMessage({
          sessionId,
          content: "Hi there! 👋 I'm your support assistant. How can I help you today?",
          sender: "bot",
          messageType: "text",
        });

        // Send menu options
        await storage.createMessage({
          sessionId,
          content: "Choose from these quick options:",
          sender: "bot",
          messageType: "menu",
          metadata: {
            options: [
              {
                id: "billing",
                text: "Billing Questions",
                icon: "fas fa-credit-card",
                action: "select_option",
                payload: { category: "billing" }
              },
              {
                id: "technical",
                text: "Technical Support", 
                icon: "fas fa-cog",
                action: "select_option",
                payload: { category: "technical" }
              },
              {
                id: "sales",
                text: "Sales Inquiry",
                icon: "fas fa-shopping-cart", 
                action: "select_option",
                payload: { category: "sales" }
              }
            ]
          }
        });
      }

      res.json({ session });
    } catch (error) {
      console.error("Error creating/getting session:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get messages for a session
  app.get("/api/chat/:sessionId/messages", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getRecentMessages(sessionId, 100);
      res.json({ messages });
    } catch (error) {
      console.error("Error getting messages:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Send a message
  app.post("/api/chat/:sessionId/messages", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messageData = insertMessageSchema.parse({
        ...req.body,
        sessionId,
        sender: "user"
      });

      const userMessage = await storage.createMessage(messageData);

      // Generate bot response based on message content
      const botResponse = await generateBotResponse(messageData.content, sessionId);
      const botMessage = await storage.createMessage(botResponse);

      res.json({ userMessage, botMessage });
    } catch (error) {
      console.error("Error sending message:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid message data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Handle option selection
  app.post("/api/chat/:sessionId/select-option", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { optionId, payload } = req.body;

      // Create user message for the selection
      await storage.createMessage({
        sessionId,
        content: getOptionDisplayText(optionId),
        sender: "user",
        messageType: "text",
      });

      // Generate bot response based on option selection
      const botResponse = await generateAIOptionResponse(optionId, payload, sessionId);
      const botMessage = await storage.createMessage(botResponse);

      res.json({ botMessage });
    } catch (error) {
      console.error("Error handling option selection:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function getOptionDisplayText(optionId: string): string {
  const optionTexts: Record<string, string> = {
    billing: "I have a question about my billing",
    technical: "I need technical support",
    sales: "I have a sales inquiry",
    payment: "I have payment issues",
    subscription: "I want to change my subscription",
    invoice: "I need to download an invoice"
  };
  return optionTexts[optionId] || "Selected option";
}

async function generateBotResponse(userMessage: string, sessionId: string) {
  try {
    // Get conversation history for context
    const recentMessages = await storage.getRecentMessages(sessionId, 10);
    const conversationHistory = recentMessages
      .slice(-5) // Last 5 messages for context
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

    // Generate structured response using OpenAI
    const aiResponse = await generateStructuredResponse(userMessage, sessionId, conversationHistory);

    return {
      sessionId,
      content: aiResponse.content,
      sender: "bot" as const,
      messageType: aiResponse.messageType,
      metadata: aiResponse.metadata
    };
  } catch (error) {
    console.error("Error generating AI response:", error);

    // Fallback to simple response
    return {
      sessionId,
      content: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
      sender: "bot" as const,
      messageType: "text" as const,
      metadata: {
        quickReplies: ["Try again", "Contact support", "Main menu"]
      }
    };
  }
}

async function generateAIOptionResponse(optionId: string, payload: any, sessionId: string) {
  try {
    // Get conversation history for context
    const recentMessages = await storage.getRecentMessages(sessionId, 10);
    const conversationHistory = recentMessages
      .slice(-5) // Last 5 messages for context
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

    // Generate structured response using OpenAI
    const aiResponse = await generateOptionResponse(optionId, payload, sessionId, conversationHistory);

    return {
      sessionId,
      content: aiResponse.content,
      sender: "bot" as const,
      messageType: aiResponse.messageType,
      metadata: aiResponse.metadata
    };
  } catch (error) {
    console.error("Error generating AI option response:", error);

    // Fallback to simple response
    return {
      sessionId,
      content: "Thank you for your selection. How else can I assist you today?",
      sender: "bot" as const,
      messageType: "text" as const,
      metadata: {
        quickReplies: ["Start over", "Contact agent", "End chat"]
      }
    };
  }
}