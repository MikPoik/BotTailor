import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema, insertChatSessionSchema, RichMessageSchema } from "@shared/schema";
import { z } from "zod";
import { generateStructuredResponse, generateOptionResponse, generateStreamingResponse } from "./openai-service";
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

        // Generate AI welcome message bubbles
        const welcomeResponse = await generateStructuredResponse(
          "User has just started a new chat session. Provide a friendly welcome message and ask how you can help them today.",
          sessionId,
          []
        );

        // Create separate messages for each bubble
        for (let i = 0; i < welcomeResponse.bubbles.length; i++) {
          const bubble = welcomeResponse.bubbles[i];
          await storage.createMessage({
            sessionId,
            content: bubble.content,
            sender: "bot",
            messageType: bubble.messageType,
            metadata: {
              ...bubble.metadata || {},
              isFollowUp: i > 0 // Mark all messages after the first as follow-up
            }
          });

          // Add small delay between bubbles for realistic timing
        }
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

  // Send a message with streaming response
  app.post("/api/chat/:sessionId/messages/stream", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { content, internalMessage, ...otherData } = req.body;

      const messageData = insertMessageSchema.parse({
        ...otherData,
        content, // Use the display text for the user message
        sessionId,
        sender: "user"
      });

      // Set headers for Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      });

      // Create user message first
      const userMessage = await storage.createMessage(messageData);

      // Send user message confirmation
      res.write(`data: ${JSON.stringify({ 
        type: 'user_message', 
        message: userMessage 
      })}\n\n`);

      // Get conversation history for context
      const recentMessages = await storage.getRecentMessages(sessionId, 10);
      const conversationHistory = recentMessages
        .filter(msg => msg.id !== userMessage.id) // Exclude the message we just created
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));

      // Generate streaming response using internal message if provided, otherwise use display text
      const aiInputMessage = internalMessage || messageData.content;
      const streamingGenerator = generateStreamingResponse(
        aiInputMessage,
        sessionId,
        conversationHistory
      );

      const createdMessages = [];

      for await (const chunk of streamingGenerator) {
        if (chunk.type === 'bubble' && chunk.bubble) {
          // Mark as follow-up if this isn't the first bubble in this sequence
          const isFollowUp = createdMessages.length > 0;

          // Create and store each bubble as it becomes complete
          const message = await storage.createMessage({
            sessionId,
            content: chunk.bubble.content,
            sender: "bot",
            messageType: chunk.bubble.messageType,
            metadata: {
              ...chunk.bubble.metadata,
              isFollowUp
            }
          });

          createdMessages.push(message);

          // Send the completed bubble immediately
          res.write(`data: ${JSON.stringify({ 
            type: 'bubble', 
            message: message
          })}\n\n`);

        } else if (chunk.type === 'complete') {
          // All bubbles processed, send final completion
          res.write(`data: ${JSON.stringify({ 
            type: 'complete', 
            messages: createdMessages
          })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
      res.end();

    } catch (error) {
      console.error("Error in streaming message:", error);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: 'Internal server error' 
      })}\n\n`);
      res.end();
    }
  });

  // Send a message (non-streaming fallback)
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

      // Create separate messages for each bubble and return the last one
      let lastMessage;
      for (const bubble of botResponse.bubbles) {
        lastMessage = await storage.createMessage({
          sessionId,
          content: bubble.content,
          sender: "bot",
          messageType: bubble.messageType,
          metadata: bubble.metadata
        });
      }

      res.json({ userMessage, botMessage: lastMessage });
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
      const { optionId, payload, optionText } = req.body;

      // Use the option text from the client (which comes from AI response) or fallback
      const displayText = optionText || getOptionDisplayText(optionId);

      // Create user message for the selection
      const userMessage = await storage.createMessage({
        sessionId,
        content: displayText,
        sender: "user",
        messageType: "text",
      });

      // Get conversation history for context
      const recentMessages = await storage.getRecentMessages(sessionId, 10);
      const conversationHistory = recentMessages
        .slice(-5) // Last 5 messages for context
        .filter(msg => msg.content !== null && msg.content !== undefined) // Filter out null/undefined content
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content || `[${msg.messageType} message]` // Provide fallback for empty content
        }));

      // Generate response for the option selection
      const response = await generateOptionResponse(optionId, payload, sessionId, conversationHistory);

      if (response.bubbles && response.bubbles.length > 0) {
        // Create and store all bubbles as bot messages
        const allMessages = [];

        for (let i = 0; i < response.bubbles.length; i++) {
          const bubble = response.bubbles[i];
          const isFollowUp = i > 0;

          const botMessage = await storage.createMessage({
            sessionId,
            content: bubble.content,
            sender: "bot",
            messageType: bubble.messageType,
            metadata: {
              ...bubble.metadata || {},
              isFollowUp
            }
          });

          allMessages.push(botMessage);
        }

        res.json({ 
          success: true, 
          userMessage, 
          botMessage: allMessages[0], // First message for backward compatibility
          allMessages // All messages for multi-bubble handling
        });
      } else {
        // Fallback response
        const botMessage = await storage.createMessage({
          sessionId,
          content: "Thank you for your selection. How else can I help you?",
          sender: "bot",
          messageType: "text",
          metadata: {}
        });

        res.json({ 
          success: true, 
          userMessage, 
          botMessage,
          allMessages: [botMessage]
        });
      }
    } catch (error) {
      console.error("Error handling option selection:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Chat widget page
  app.get("/chat-widget", async (req: Request, res: Response) => {
    try {
      const sessionId = req.query.sessionId as string || `embed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const isMobile = req.query.mobile === 'true';
      const embedded = req.query.embedded === 'true';

      console.log(`Loading chat widget - SessionId: ${sessionId}, Mobile: ${isMobile}, Embedded: ${embedded}`);

      let html = fs.readFileSync(path.join(__dirname, 'templates/chat-widget.html'), 'utf8');

      // Replace placeholders with actual values
      const apiUrl = req.protocol + '://' + req.get('host');
      html = html.replace(/{{SESSION_ID}}/g, sessionId as string);
      html = html.replace(/{{API_URL}}/g, apiUrl);
      html = html.replace(/{{IS_MOBILE}}/g, isMobile.toString());

      console.log(`Chat widget served - API URL: ${apiUrl}`);
      res.setHeader('Content-Type', 'text/html');
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

      // Create session if it doesn't exist, but don't generate welcome messages yet
      let session = await storage.getChatSession(sessionId);
      if (!session) {
        session = await storage.createChatSession({ sessionId });
      }

      const messages = await storage.getRecentMessages(sessionId, 100);

      // If this is a new session with no messages, generate welcome messages now
      if (messages.length === 0) {
        const welcomeResponse = await generateStructuredResponse(
          "User has just started a new chat session. Provide a friendly welcome message and ask how you can help them today.",
          sessionId,
          []
        );

        if (welcomeResponse.bubbles && welcomeResponse.bubbles.length > 0) {
          for (let i = 0; i < welcomeResponse.bubbles.length; i++) {
            const bubble = welcomeResponse.bubbles[i];
            await storage.createMessage({
              sessionId,
              content: bubble.content,
              sender: "bot",
              messageType: bubble.messageType,
              metadata: {
                ...bubble.metadata || {},
                isFollowUp: i > 0
              }
            });
          }
        }
      }

      res.json({ messages });
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

      // Create separate messages for each bubble and return the last one
      let lastMessage;
      for (const bubble of botResponse.bubbles) {
        lastMessage = await storage.createMessage({
          sessionId,
          content: bubble.content,
          sender: "bot",
          messageType: bubble.messageType,
          metadata: bubble.metadata
        });

        // Add small delay between bubbles for realistic timing
      }

      res.json(lastMessage);
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Serve chat widget styles
  app.get('/styles.css', (req, res) => {
    const stylesPath = path.join(__dirname, 'templates', 'styles.css');

    if (fs.existsSync(stylesPath)) {
      res.setHeader('Content-Type', 'text/css');
      res.setHeader('Cache-Control', 'no-cache');
      const fileContent = fs.readFileSync(stylesPath, 'utf8');
      res.send(fileContent);
    } else {
      res.status(404).send('/* Styles not found */');
    }
  });

  // Serve JavaScript component files
  app.get('/components/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'templates', 'components', filename);

    // Check if file exists and serve it
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'no-cache');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      res.send(fileContent);
    } else {
      res.status(404).send('// Component not found');
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function getOptionDisplayText(optionId: string): string {
  // Simplified fallback mappings for common patterns
  const optionTexts: Record<string, string> = {
    // Basic categories - these are used as fallbacks only
    billing: "I have a question about my billing",
    technical: "I need technical support",
    sales: "I have a sales inquiry",
    payment: "I have payment issues",
    subscription: "I want to change my subscription",
    invoice: "I need to download an invoice"
  };

  // Return mapped text or generate a readable fallback from the optionId
  return optionTexts[optionId] || optionId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
}

async function generateBotResponse(userMessage: string, sessionId: string) {
  try {
    // Get conversation history for context
    const recentMessages = await storage.getRecentMessages(sessionId, 10);
    const conversationHistory = recentMessages
      .slice(-5) // Last 5 messages for context
      .filter(msg => msg.content !== null && msg.content !== undefined) // Filter out null/undefined content
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content || `[${msg.messageType} message]` // Provide fallback for empty content
      }));

    // Generate structured response using OpenAI
    const aiResponse = await generateStructuredResponse(userMessage, sessionId, conversationHistory);

    return aiResponse;
  } catch (error) {
    console.error("Error generating AI response:", error);

    // Fallback to simple multi-bubble response
    return {
      bubbles: [
        {
          messageType: "text" as const,
          content: "I'm sorry, I'm having trouble processing your request right now.",
        },
        {
          messageType: "quickReplies" as const,
          content: "Would you like to:",
          metadata: {
            quickReplies: ["Try again", "Contact support", "Main menu"]
          }
        }
      ]
    };
  }
}

async function generateAIOptionResponse(optionId: string, payload: any, sessionId: string) {
  try {
    // Get conversation history for context
    const recentMessages = await storage.getRecentMessages(sessionId, 10);
    const conversationHistory = recentMessages
      .slice(-5) // Last 5 messages for context
      .filter(msg => msg.content !== null && msg.content !== undefined) // Filter out null/undefined content
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content || `[${msg.messageType} message]` // Provide fallback for empty content
      }));

    // Generate structured response using OpenAI
    const aiResponse = await generateOptionResponse(optionId, payload, sessionId, conversationHistory);

    return aiResponse;
  } catch (error) {
    console.error("Error generating AI option response:", error);

    // Fallback to simple multi-bubble response
    return {
      bubbles: [
        {
          messageType: "text" as const,
          content: "Thank you for your selection!",
        },
        {
          messageType: "quickReplies" as const,
          content: "How else can I assist you today?",
          metadata: {
            quickReplies: ["Start over", "Contact agent", "End chat"]
          }
        }
      ]
    };
  }
}