import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema, insertChatSessionSchema, RichMessageSchema, insertChatbotConfigSchema, HomeScreenConfigSchema, insertWebsiteSourceSchema, type WebsiteSource } from "@shared/schema";
import { z } from "zod";
import { generateStructuredResponse, generateOptionResponse, generateStreamingResponse } from "./openai-service";
import { generateHomeScreenConfig, modifyHomeScreenConfig, getDefaultHomeScreenConfig } from "./ui-designer-service";
import { WebsiteScanner } from "./website-scanner";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Request, Response, NextFunction } from "express";
import { ChatService } from "./storage";
import { fromZodError } from "zod-validation-error";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { upload, uploadAvatar, getFileFromStorage } from "./upload-service";
import passport from "passport";
import { eq, desc, and, isNull, or, sql, inArray } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chatService = new ChatService();

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Avatar upload routes
  app.post('/api/upload/avatar', isAuthenticated, upload.single('avatar'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.claims.sub;
      const result = await uploadAvatar(req.file, userId);

      if (!result.success) {
        return res.status(500).json({ message: result.error });
      }

      res.json({ url: result.url });
    } catch (error) {
      console.error("Avatar upload error:", error);
      res.status(500).json({ message: "Failed to upload avatar" });
    }
  });

  // File serving route
  app.get('/api/storage/*', async (req, res) => {
    try {
      const fileName = req.params[0]; // Get everything after /api/storage/
      const result = await getFileFromStorage(fileName);

      if (!result.success) {
        return res.status(404).json({ message: result.error });
      }

      // Set appropriate headers
      if (result.contentType) {
        res.set('Content-Type', result.contentType);
      }
      res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

      res.send(result.data);
    } catch (error) {
      console.error("File serving error:", error);
      res.status(500).json({ message: "Failed to serve file" });
    }
  });

  // Chatbot config routes
  app.get('/api/chatbots', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const configs = await storage.getChatbotConfigs(userId);
      res.json(configs);
    } catch (error) {
      console.error("Error fetching chatbot configs:", error);
      res.status(500).json({ message: "Failed to fetch chatbot configs" });
    }
  });

  // Get chatbot by GUID for authenticated users
  app.get('/api/chatbots/guid/:guid', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { guid } = req.params;

      const config = await storage.getChatbotConfigByGuid(userId, guid);
      if (!config) {
        return res.status(404).json({ message: "Chatbot config not found" });
      }

      res.json(config);
    } catch (error) {
      console.error("Error fetching chatbot config by GUID:", error);
      res.status(500).json({ message: "Failed to fetch chatbot config" });
    }
  });

  app.get('/api/chatbots/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const config = await storage.getChatbotConfig(parseInt(id));
      if (!config || config.userId !== userId) {
        return res.status(404).json({ message: "Chatbot config not found" });
      }

      res.json(config);
    } catch (error) {
      console.error("Error fetching chatbot config:", error);
      res.status(500).json({ message: "Failed to fetch chatbot config" });
    }
  });



  // Public endpoint to get chatbot by GUID (for public widgets and embedding)
  app.get('/api/public/chatbots/:guid', async (req: Request, res: Response) => {
    try {
      const { guid } = req.params;

      const config = await storage.getPublicChatbotConfigByGuid(guid);
      if (!config || !config.isActive) {
        return res.status(404).json({ message: "Chatbot config not found or inactive" });
      }

      // Return only public-safe fields
      const publicConfig = {
        id: config.id,
        guid: config.guid,
        name: config.name,
        description: config.description,
        avatarUrl: config.avatarUrl,
        welcomeMessage: config.welcomeMessage,
        fallbackMessage: config.fallbackMessage,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        systemPrompt: config.systemPrompt,
        isActive: config.isActive,
        homeScreenConfig: config.homeScreenConfig
      };

      res.json(publicConfig);
    } catch (error) {
      console.error("Error fetching public chatbot config by GUID:", error);
      res.status(500).json({ message: "Failed to fetch chatbot config" });
    }
  });

  // Get site-wide default chatbot (for non-authenticated users)
  app.get('/api/public/default-chatbot', async (req: Request, res: Response) => {
    try {
      const defaultGuid = process.env.DEFAULT_SITE_CHATBOT_GUID;

      if (!defaultGuid) {
        return res.status(404).json({ message: "No default chatbot configured" });
      }

      const config = await storage.getPublicChatbotConfigByGuid(defaultGuid);
      if (!config || !config.isActive) {
        return res.status(404).json({ message: "Default chatbot not found or inactive" });
      }

      // Return only public-safe fields
      const publicConfig = {
        id: config.id,
        guid: config.guid,
        name: config.name,
        description: config.description,
        avatarUrl: config.avatarUrl,
        welcomeMessage: config.welcomeMessage,
        fallbackMessage: config.fallbackMessage,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        systemPrompt: config.systemPrompt,
        isActive: config.isActive,
        homeScreenConfig: config.homeScreenConfig
      };

      res.json(publicConfig);
    } catch (error) {
      console.error("Error fetching default chatbot config:", error);
      res.status(500).json({ message: "Failed to fetch default chatbot config" });
    }
  });

  app.post('/api/chatbots', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Create a client-side schema that excludes userId since it comes from auth
      const clientChatbotSchema = insertChatbotConfigSchema.omit({ userId: true });

      // Validate request body (without userId)
      const validationResult = clientChatbotSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: fromZodError(validationResult.error).toString() 
        });
      }

      const configData = { ...validationResult.data, userId };
      const config = await storage.createChatbotConfig(configData);
      res.json(config);
    } catch (error) {
      console.error("Error creating chatbot config:", error);
      res.status(500).json({ message: "Failed to create chatbot config" });
    }
  });

  app.put('/api/chatbots/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Verify ownership
      const existingConfig = await storage.getChatbotConfig(parseInt(id));
      if (!existingConfig || existingConfig.userId !== userId) {
        return res.status(404).json({ message: "Chatbot config not found" });
      }

      const config = await storage.updateChatbotConfig(parseInt(id), req.body);
      res.json(config);
    } catch (error) {
      console.error("Error updating chatbot config:", error);
      res.status(500).json({ message: "Failed to update chatbot config" });
    }
  });

  app.patch('/api/chatbots/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Verify ownership
      const existingConfig = await storage.getChatbotConfig(parseInt(id));
      if (!existingConfig || existingConfig.userId !== userId) {
        return res.status(404).json({ message: "Chatbot config not found" });
      }

      // For PATCH, we only update the provided fields
      const config = await storage.updateChatbotConfig(parseInt(id), req.body);
      res.json(config);
    } catch (error) {
      console.error("Error updating chatbot config:", error);
      res.status(500).json({ message: "Failed to update chatbot config" });
    }
  });

  // Update chatbot by GUID (PUT method)
  app.put('/api/chatbots/guid/:guid', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { guid } = req.params;

      // Get the chatbot by GUID first to get the ID
      const existingConfig = await storage.getChatbotConfigByGuid(userId, guid);
      if (!existingConfig) {
        return res.status(404).json({ message: "Chatbot config not found" });
      }

      const config = await storage.updateChatbotConfig(existingConfig.id, req.body);
      res.json(config);
    } catch (error) {
      console.error("Error updating chatbot config by GUID:", error);
      res.status(500).json({ message: "Failed to update chatbot config" });
    }
  });

  // Update chatbot by GUID (PATCH method)
  app.patch('/api/chatbots/guid/:guid', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { guid } = req.params;

      // Get the chatbot by GUID first to get the ID
      const existingConfig = await storage.getChatbotConfigByGuid(userId, guid);
      if (!existingConfig) {
        return res.status(404).json({ message: "Chatbot config not found" });
      }

      // For PATCH, we only update the provided fields
      const config = await storage.updateChatbotConfig(existingConfig.id, req.body);
      res.json(config);
    } catch (error) {
      console.error("Error updating chatbot config by GUID:", error);
      res.status(500).json({ message: "Failed to update chatbot config" });
    }
  });

  app.delete('/api/chatbots/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Verify ownership
      const existingConfig = await storage.getChatbotConfig(parseInt(id));
      if (!existingConfig || existingConfig.userId !== userId) {
        return res.status(404).json({ message: "Chatbot config not found" });
      }

      await storage.deleteChatbotConfig(parseInt(id));
      res.json({ message: "Chatbot config deleted" });
    } catch (error) {
      console.error("Error deleting chatbot config:", error);
      res.status(500).json({ message: "Failed to delete chatbot config" });
    }
  });

  // Website Sources Routes
  app.get('/api/chatbots/:id/website-sources', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Verify ownership
      const existingConfig = await storage.getChatbotConfig(parseInt(id));
      if (!existingConfig || existingConfig.userId !== userId) {
        return res.status(404).json({ message: "Chatbot config not found" });
      }

      const sources = await storage.getWebsiteSources(parseInt(id));
      res.json(sources);
    } catch (error) {
      console.error("Error fetching website sources:", error);
      res.status(500).json({ message: "Failed to fetch website sources" });
    }
  });

  // Get website sources by chatbot GUID
  app.get('/api/chatbots/guid/:guid/website-sources', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { guid } = req.params;

      // Get the chatbot by GUID first to get the ID
      const existingConfig = await storage.getChatbotConfigByGuid(userId, guid);
      if (!existingConfig) {
        return res.status(404).json({ message: "Chatbot config not found" });
      }

      const sources = await storage.getWebsiteSources(existingConfig.id);
      res.json(sources);
    } catch (error) {
      console.error("Error fetching website sources by GUID:", error);
      res.status(500).json({ message: "Failed to fetch website sources" });
    }
  });

  app.post('/api/chatbots/:id/website-sources', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Verify ownership
      const existingConfig = await storage.getChatbotConfig(parseInt(id));
      if (!existingConfig || existingConfig.userId !== userId) {
        return res.status(404).json({ message: "Chatbot config not found" });
      }

      // Create a schema that excludes chatbotConfigId since it comes from params
      const clientSourceSchema = insertWebsiteSourceSchema.omit({ chatbotConfigId: true });

      // Validate request body
      const validationResult = clientSourceSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: fromZodError(validationResult.error).toString() 
        });
      }

      const sourceData = { ...validationResult.data, chatbotConfigId: parseInt(id) };
      const source = await storage.createWebsiteSource(sourceData);

      // Start scanning in background
      console.log(`Starting background scan for website source ${source.id}: ${source.url}`);
      const scanner = new WebsiteScanner();
      scanner.scanWebsite(source.id).then(result => {
        console.log(`Scan completed for ${source.url}:`, result);
      }).catch(error => {
        console.error("Background scanning error:", error);
      });

      res.json(source);
    } catch (error) {
      console.error("Error creating website source:", error);
      console.error("Error details:", error.stack);
      res.status(500).json({ 
        message: "Failed to create website source",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.delete('/api/website-sources/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Get the website source to verify ownership
      const source = await storage.getWebsiteSource(parseInt(id));
      if (!source) {
        return res.status(404).json({ message: "Website source not found" });
      }

      // Verify chatbot ownership
      const chatbot = await storage.getChatbotConfig(source.chatbotConfigId);
      if (!chatbot || chatbot.userId !== userId) {
        return res.status(404).json({ message: "Website source not found" });
      }

      await storage.deleteWebsiteSource(parseInt(id));
      res.json({ message: "Website source deleted" });
    } catch (error) {
      console.error("Error deleting website source:", error);
      res.status(500).json({ message: "Failed to delete website source" });
    }
  });

  app.post('/api/website-sources/:id/rescan', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // Get the website source to verify ownership
      const source = await storage.getWebsiteSource(parseInt(id));
      if (!source) {
        return res.status(404).json({ message: "Website source not found" });
      }

      // Verify chatbot ownership
      const chatbot = await storage.getChatbotConfig(source.chatbotConfigId);
      if (!chatbot || chatbot.userId !== userId) {
        return res.status(404).json({ message: "Website source not found" });
      }

      // Start scanning
      const scanner = new WebsiteScanner();
      const result = await scanner.scanWebsite(parseInt(id));

      res.json(result);
    } catch (error) {
      console.error("Error rescanning website:", error);
      res.status(500).json({ message: "Failed to rescan website" });
    }
  });

  // Serve embed.js with explicit CORS headers for cross-origin embedding
  app.get('/embed.js', (req, res) => {
    try {
      // In development, serve from project root; in production, serve from dist
      const embedPath = app.get("env") === "production" 
        ? path.join(__dirname, 'public', 'embed.js')
        : path.join(__dirname, '..', 'public', 'embed.js');

      if (fs.existsSync(embedPath)) {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        const fileContent = fs.readFileSync(embedPath, 'utf8');
        res.send(fileContent);
      } else {
        console.error('Embed.js not found at:', embedPath);
        res.status(404).send('// Embed script not found');
      }
    } catch (error) {
      console.error('Error serving embed.js:', error);
      res.status(500).send('// Error loading embed script');
    }
  });

  // Create or get chat session
  app.post("/api/chat/session", async (req, res) => {
    try {
      const { sessionId, chatbotConfigId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      let session = await storage.getChatSession(sessionId);

      if (!session) {
        session = await storage.createChatSession({ 
          sessionId,
          chatbotConfigId: chatbotConfigId || null
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

  // Send a message with streaming response
  app.post("/api/chat/:sessionId/messages/stream", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { content, internalMessage, chatbotConfigId, ...otherData } = req.body;

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

      // Ensure session exists before creating messages
      let session = await storage.getChatSession(sessionId);
      if (!session) {
        session = await storage.createChatSession({ 
          sessionId,
          chatbotConfigId: chatbotConfigId || null
        });
      } else if (chatbotConfigId && session.chatbotConfigId !== chatbotConfigId) {
        // Update session with new chatbot config if provided and different
        session = await storage.updateChatSession(sessionId, { 
          chatbotConfigId: chatbotConfigId 
        });
      }

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

      // Get chatbot configuration for this session (prefer the one from request, then session)
      let chatbotConfig = null;
      const configId = chatbotConfigId || session?.chatbotConfigId;
      if (configId) {
        chatbotConfig = await storage.getChatbotConfig(configId);
      }

      // Generate streaming response using internal message if provided, otherwise use display text
      const aiInputMessage = internalMessage || messageData.content;
      const streamingGenerator = generateStreamingResponse(
        aiInputMessage,
        sessionId,
        conversationHistory,
        chatbotConfig
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

  // Chat widget route with user and chatbot parameters - only match specific patterns
  app.get("/widget/:userId/:chatbotGuid", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, chatbotGuid } = req.params;
      const { embedded = "true", mobile = "false" } = req.query;

      console.log(`Loading widget for userId: ${userId}, chatbotGuid: ${chatbotGuid}`);

      // Get chatbot config from database
      const chatbotConfig = await storage.getChatbotConfigByGuid(userId, chatbotGuid);
      if (!chatbotConfig || !chatbotConfig.isActive) {
        console.log(`Chatbot not found or inactive: ${chatbotGuid}`);
        return res.status(404).send('Chatbot not found or inactive');
      }

      console.log(`Found chatbot config: ${chatbotConfig.name}`);



      const sessionId = req.query.sessionId as string || `embed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const isMobile = req.query.mobile === 'true';
      const isEmbedded = req.query.embedded === 'true';

      // Force HTTPS in production environments
      const protocol = app.get("env") === "production" ? 'https' : req.protocol;
      const apiUrl = protocol + '://' + req.get('host');

      console.log(`Environment: ${app.get("env")}, Protocol: ${protocol}, API URL: ${apiUrl}`);

      if (app.get("env") === "production") {
        const distPath = path.resolve(__dirname, "../dist/public");
        const htmlPath = path.join(distPath, 'index.html');

        console.log(`Looking for HTML file at: ${htmlPath}`);
        console.log(`File exists: ${fs.existsSync(htmlPath)}`);

        let html;
        if (!fs.existsSync(htmlPath)) {
          console.log(`HTML file not found, trying alternative paths...`);
          // Try different possible paths
          const alternativePaths = [
            path.resolve(__dirname, "./public/index.html"),
            path.resolve(__dirname, "../public/index.html"), 
            path.resolve(__dirname, "dist/public/index.html"),
            path.resolve(process.cwd(), "dist/public/index.html")
          ];

          let found = false;
          for (const altPath of alternativePaths) {
            console.log(`Trying: ${altPath} - exists: ${fs.existsSync(altPath)}`);
            if (fs.existsSync(altPath)) {
              html = fs.readFileSync(altPath, 'utf8');
              console.log(`Successfully loaded HTML from: ${altPath}`);
              found = true;
              break;
            }
          }

          if (!found) {
            return res.status(500).send('HTML template not found');
          }
        } else {
          html = fs.readFileSync(htmlPath, 'utf8');
        }

        // Inject session data and chatbot config into the HTML
        const sessionData = `
          <script>
            window.__CHAT_WIDGET_CONFIG__ = {
              sessionId: "${sessionId}",
              apiUrl: "${apiUrl}",
              isMobile: ${isMobile},
              embedded: ${isEmbedded},
              chatbotConfig: ${JSON.stringify(chatbotConfig)}
            };
          </script>
        `;

        html = html.replace('</head>', `${sessionData}</head>`);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } else {
        // In development, inject config and let Vite dev server handle the rest
        req.url = '/';
        req.chatWidgetConfig = {
          sessionId,
          apiUrl,
          isMobile,
          embedded: isEmbedded,
          chatbotConfig
        };
        next();
      }
    } catch (error) {
      console.error('Error serving chatbot widget:', error);
      res.status(500).send('Internal server error');
    }
  });

  // Chat widget page (legacy route)
  app.get("/chat-widget", async (req: Request, res: Response) => {
    try {
      const sessionId = req.query.sessionId as string || `embed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const isMobile = req.query.mobile === 'true';
      const embedded = req.query.embedded === 'true';

      console.log(`Loading chat widget - SessionId: ${sessionId}, Mobile: ${isMobile}, Embedded: ${embedded}`);

      // Force HTTPS in production environments
      const protocol = app.get("env") === "production" ? 'https' : req.protocol;
      const apiUrl = protocol + '://' + req.get('host');

      // In production, serve the built React app
      if (app.get("env") === "production") {
        // Read the built index.html
        const distPath = path.resolve(__dirname, "../dist/public");
        let html = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');

        // Inject session data into the HTML
        const sessionData = `
          <script>
            window.__CHAT_WIDGET_CONFIG__ = {
              sessionId: "${sessionId}",
              apiUrl: "${apiUrl}",
              isMobile: ${isMobile},
              embedded: ${embedded}
            };
          </script>
        `;

        // Insert session data before closing head tag
        html = html.replace('</head>', `${sessionData}</head>`);

        console.log(`Production chat widget served - API URL: ${apiUrl}`);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } else {
        // In development, serve with Vite dev server integration
        let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Widget</title>
    <script>
      window.__CHAT_WIDGET_CONFIG__ = {
        sessionId: "${sessionId}",
        apiUrl: "${apiUrl}",
        isMobile: ${isMobile},
        embedded: ${embedded}
      };
    </script>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>
        `;

        console.log(`Development chat widget served - API URL: ${apiUrl}`);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      }
    } catch (error) {
      console.error('Error serving chat widget:', error);
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
      }

      const messages = await storage.getRecentMessages(sessionId, 100);

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

  // UI Designer API routes
  app.post('/api/ui-designer/generate', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const config = await generateHomeScreenConfig(prompt);
      res.json({ config });
    } catch (error) {
      console.error("Error generating UI config:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to generate UI" });
    }
  });

  app.post('/api/ui-designer/modify', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, currentConfig } = req.body;

      if (!prompt || !currentConfig) {
        return res.status(400).json({ message: "Prompt and current config are required" });
      }

      const config = await modifyHomeScreenConfig(currentConfig, prompt);
      res.json({ config });
    } catch (error) {
      console.error("Error modifying UI config:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to modify UI" });
    }
  });

  app.get('/api/ui-designer/default', isAuthenticated, async (req: any, res) => {
    try {
      const config = getDefaultHomeScreenConfig();
      res.json({ config });
    } catch (error) {
      console.error("Error getting default config:", error);
      res.status(500).json({ message: "Failed to get default configuration" });
    }
  });

  app.get('/api/callback', passport.authenticate('local', { 
    failureRedirect: '/',
    successRedirect: '/dashboard'
  }));

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