import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema, insertChatSessionSchema, RichMessageSchema } from "@shared/schema";
import { z } from "zod";

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

      // Generate appropriate response based on option
      const botResponse = await generateOptionResponse(optionId, payload, sessionId);
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
  // Simple keyword-based responses
  const message = userMessage.toLowerCase();
  
  if (message.includes("billing") || message.includes("payment") || message.includes("invoice")) {
    return {
      sessionId,
      content: "I can help you with billing questions, payment issues, or subscription changes.",
      sender: "bot" as const,
      messageType: "card" as const,
      metadata: {
        title: "Billing Support",
        description: "I can help you with billing questions, payment issues, or subscription changes.",
        imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
        buttons: [
          {
            id: "payment",
            text: "Payment Issues",
            action: "select_option",
            payload: { category: "payment" }
          },
          {
            id: "subscription", 
            text: "Subscription Changes",
            action: "select_option",
            payload: { category: "subscription" }
          },
          {
            id: "invoice",
            text: "Download Invoice", 
            action: "select_option",
            payload: { category: "invoice" }
          }
        ]
      }
    };
  }

  if (message.includes("technical") || message.includes("support") || message.includes("help")) {
    return {
      sessionId,
      content: "I'm here to help with technical issues. What specific problem are you experiencing?",
      sender: "bot" as const,
      messageType: "text" as const,
      metadata: {
        quickReplies: ["Login issues", "App not working", "Feature request", "Other"]
      }
    };
  }

  if (message.includes("sales") || message.includes("pricing") || message.includes("buy")) {
    return {
      sessionId,
      content: "I'd be happy to help with sales questions! What would you like to know about our products or services?",
      sender: "bot" as const,
      messageType: "text" as const,
      metadata: {
        quickReplies: ["Pricing", "Features", "Trial", "Contact sales"]
      }
    };
  }

  // Default response
  return {
    sessionId,
    content: "I understand. Let me help you with that. Could you provide more details about what you need assistance with?",
    sender: "bot" as const,
    messageType: "text" as const,
    metadata: {
      quickReplies: ["Get help", "Contact agent", "More options"]
    }
  };
}

async function generateOptionResponse(optionId: string, payload: any, sessionId: string) {
  switch (optionId) {
    case "billing":
      return {
        sessionId,
        content: "I can help you with billing questions, payment issues, or subscription changes.",
        sender: "bot" as const,
        messageType: "card" as const,
        metadata: {
          title: "Billing Support",
          description: "I can help you with billing questions, payment issues, or subscription changes.",
          imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
          buttons: [
            {
              id: "payment",
              text: "Payment Issues",
              action: "select_option",
              payload: { category: "payment" }
            },
            {
              id: "subscription",
              text: "Subscription Changes", 
              action: "select_option",
              payload: { category: "subscription" }
            },
            {
              id: "invoice",
              text: "Download Invoice",
              action: "select_option", 
              payload: { category: "invoice" }
            }
          ]
        }
      };

    case "technical":
      return {
        sessionId,
        content: "I'm here to help with technical issues. What specific problem are you experiencing?",
        sender: "bot" as const,
        messageType: "text" as const,
        metadata: {
          quickReplies: ["Login issues", "App not working", "Feature request", "Contact support"]
        }
      };

    case "sales":
      return {
        sessionId,
        content: "I'd be happy to help with sales questions! What would you like to know?",
        sender: "bot" as const,
        messageType: "text" as const,
        metadata: {
          quickReplies: ["Pricing info", "Product demo", "Contact sales", "Free trial"]
        }
      };

    case "payment":
      return {
        sessionId,
        content: "I can help resolve payment issues. Are you experiencing problems with a recent payment or need to update your payment method?",
        sender: "bot" as const,
        messageType: "text" as const,
        metadata: {
          quickReplies: ["Failed payment", "Update card", "Payment history", "Contact billing"]
        }
      };

    case "subscription":
      return {
        sessionId,
        content: "I can help you change your subscription. Would you like to upgrade, downgrade, or cancel your current plan?",
        sender: "bot" as const,
        messageType: "text" as const,
        metadata: {
          quickReplies: ["Upgrade plan", "Downgrade plan", "Cancel subscription", "View current plan"]
        }
      };

    case "invoice":
      return {
        sessionId,
        content: "I can help you access your invoices. You can download your recent invoices from your account dashboard or I can email them to you.",
        sender: "bot" as const,
        messageType: "text" as const,
        metadata: {
          quickReplies: ["Download latest", "Email invoices", "View all invoices", "Need help accessing"]
        }
      };

    default:
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
