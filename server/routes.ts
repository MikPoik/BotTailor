import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema, insertChatSessionSchema, RichMessageSchema } from "@shared/schema";
import { z } from "zod";
import { generateStructuredResponse, generateOptionResponse } from "./openai-service";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Request, Response } from "express";
import { ChatService } from "./storage";
import { fromZodError } from "zod-validation-error";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chatService = new ChatService();

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

        // Generate AI welcome message
        const welcomeResponse = await generateStructuredResponse(
          "User has just started a new chat session. Provide a friendly welcome message and ask how you can help them today.",
          sessionId,
          []
        );

        await storage.createMessage({
          sessionId,
          content: welcomeResponse.content,
          sender: "bot",
          messageType: welcomeResponse.messageType,
          metadata: welcomeResponse.metadata
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

  // Serve chat widget page for embedding
  app.get("/chat-widget", (req: Request, res: Response) => {
    const { sessionId, embedded, mobile } = req.query;

    const isMobile = mobile === 'true';
    const isEmbedded = embedded === 'true';

    try {
      // Read the template file
      const templatePath = path.join(__dirname, 'templates', 'chat-widget.html');
      let html = fs.readFileSync(templatePath, 'utf-8');

      // Replace placeholders with actual values
      html = html.replace(/{{SESSION_ID}}/g, sessionId as string);
      html = html.replace(/{{API_URL}}/g, req.protocol + '://' + req.get('host'));
      html = html.replace(/{{IS_MOBILE}}/g, isMobile.toString());

      res.send(html);
    } catch (error) {
      console.error('Error reading chat widget template:', error);
      res.status(500).send('Internal server error');
    }
  });

  // Chat API routes for embedded widget
  app.get("/api/chat/:sessionId", async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId;
      
      // Create session if it doesn't exist
      let session = await storage.getChatSession(sessionId);
      if (!session) {
        session = await storage.createChatSession({ sessionId });
        
        // Generate AI welcome message
        const welcomeResponse = await generateStructuredResponse(
          "User has just started a new chat session. Provide a friendly welcome message and ask how you can help them today.",
          sessionId,
          []
        );

        await storage.createMessage({
          sessionId,
          content: welcomeResponse.content,
          sender: "bot",
          messageType: welcomeResponse.messageType,
          metadata: welcomeResponse.metadata
        });
      }
      
      const messages = await storage.getRecentMessages(sessionId, 100);
      res.json(messages);
    } catch (error) {
      console.error("Error getting messages:", error);
      res.status(500).json({ error: "Failed to retrieve messages" });
    }
  });

  app.post("/api/chat/:sessionId", async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Create user message
      const userMessage = await storage.createMessage({
        sessionId,
        content: message,
        sender: "user",
        messageType: "text"
      });

      // Generate AI bot response using the full system
      const botResponse = await generateBotResponse(message, sessionId);
      const botMessage = await storage.createMessage(botResponse);

      res.json(botMessage);
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function getOptionDisplayText(optionId: string): string {
  const optionTexts: Record<string, string> = {
    // Main categories
    billing: "I have a question about my billing",
    technical: "I need technical support",
    sales: "I have a sales inquiry",
    payment: "I have payment issues",
    subscription: "I want to change my subscription",
    invoice: "I need to download an invoice",
    
    // Payment-related options
    payment_issues: "Payment Issues",
    paymentIssues: "Payment Issues",
    updatePaymentMethod: "Update Payment Method",
    viewBilling: "View Billing History",
    refund: "Request Refund",
    
    // Specific issues
    issue1: "My payment was declined",
    issue2: "I was charged incorrectly", 
    issue3: "I need a refund",
    
    // Subscription options
    upgrade: "Upgrade subscription",
    downgrade: "Downgrade subscription",
    cancel: "Cancel subscription",
    
    // Technical support
    account: "Account issues",
    password: "Password reset",
    login: "Login problems",
    
    // General
    other: "Other issues",
    contact_agent: "Contact human agent"
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