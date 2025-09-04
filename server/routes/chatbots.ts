
import type { Express } from "express";
import { storage } from "../storage";
import { insertChatbotConfigSchema, HomeScreenConfigSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { isAuthenticated } from "../replitAuth";
import { generateMultiBubbleResponse } from "../openai";

// Chatbot management routes
export function setupChatbotRoutes(app: Express) {
  // Get all chatbots for authenticated user
  app.get('/api/chatbots', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chatbots = await storage.getChatbotConfigs(userId);
      res.json(chatbots);
    } catch (error) {
      console.error("Error fetching chatbots:", error);
      res.status(500).json({ message: "Failed to fetch chatbots" });
    }
  });

  // Get specific chatbot configuration by GUID  
  app.get('/api/chatbots/:guid', isAuthenticated, async (req: any, res) => {
    try {
      const { guid } = req.params;
      const userId = req.user.claims.sub;
      
      const chatbot = await storage.getChatbotConfigByGuid(userId, guid);
      
      if (!chatbot) {
        return res.status(404).json({ message: "Chatbot not found" });
      }
      
      res.json(chatbot);
    } catch (error) {
      console.error("Error fetching chatbot:", error);
      res.status(500).json({ message: "Failed to fetch chatbot" });
    }
  });

  // Create new chatbot
  app.post('/api/chatbots', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const body = req.body;
      
      const chatbotData = insertChatbotConfigSchema.parse({
        ...body,
        userId,
      });

      const chatbot = await storage.createChatbotConfig(chatbotData);
      res.json(chatbot);
    } catch (error) {
      console.error("Error creating chatbot:", error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create chatbot" });
    }
  });

  // Update chatbot by GUID
  app.put('/api/chatbots/:guid', isAuthenticated, async (req: any, res) => {
    try {
      const { guid } = req.params;
      const userId = req.user.claims.sub;
      const body = req.body;

      // Verify ownership and get chatbot
      const existingChatbot = await storage.getChatbotConfigByGuid(userId, guid);
      if (!existingChatbot) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      const updateData = insertChatbotConfigSchema.partial().parse(body);
      const chatbot = await storage.updateChatbotConfig(existingChatbot.id, updateData);
      
      res.json(chatbot);
    } catch (error) {
      console.error("Error updating chatbot:", error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update chatbot" });
    }
  });

  // Delete chatbot by GUID
  app.delete('/api/chatbots/:guid', isAuthenticated, async (req: any, res) => {
    try {
      const { guid } = req.params;
      const userId = req.user.claims.sub;

      // Verify ownership and get chatbot
      const existingChatbot = await storage.getChatbotConfigByGuid(userId, guid);
      if (!existingChatbot) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      await storage.deleteChatbotConfig(existingChatbot.id);
      res.json({ message: "Chatbot deleted successfully" });
    } catch (error) {
      console.error("Error deleting chatbot:", error);
      res.status(500).json({ message: "Failed to delete chatbot" });
    }
  });

  // Update chatbot home screen configuration by GUID
  app.put('/api/chatbots/:guid/home-screen', isAuthenticated, async (req: any, res) => {
    try {
      const { guid } = req.params;
      const userId = req.user.claims.sub;
      const { homeScreenConfig } = req.body;

      // Verify ownership and get chatbot
      const existingChatbot = await storage.getChatbotConfigByGuid(userId, guid);
      if (!existingChatbot) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      // Validate home screen config
      const validatedConfig = HomeScreenConfigSchema.parse(homeScreenConfig);
      
      const updatedChatbot = await storage.updateChatbotConfig(existingChatbot.id, {
        homeScreenConfig: validatedConfig
      });

      res.json(updatedChatbot);
    } catch (error) {
      console.error("Error updating home screen config:", error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update home screen configuration" });
    }
  });

  // PATCH route for partial chatbot updates by GUID (for UI designer)
  app.patch('/api/chatbots/guid/:guid', isAuthenticated, async (req: any, res) => {
    try {
      const { guid } = req.params;
      const userId = req.user.claims.sub;
      const body = req.body;

      // Verify ownership and get chatbot
      const existingChatbot = await storage.getChatbotConfigByGuid(userId, guid);
      if (!existingChatbot) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      // Parse partial update data
      const updateData = insertChatbotConfigSchema.partial().parse(body);
      const updatedChatbot = await storage.updateChatbotConfig(existingChatbot.id, updateData);
      
      res.json(updatedChatbot);
    } catch (error) {
      console.error("Error updating chatbot:", error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update chatbot" });
    }
  });

  // Prompt assistance endpoint for AI-powered prompt generation and improvement
  app.post('/api/chatbots/:guid/prompt-assistant', isAuthenticated, async (req: any, res) => {
    try {
      const { guid } = req.params;
      const userId = req.user.claims.sub;
      const { action, context, userMessage } = req.body;

      // Verify ownership and get chatbot
      const existingChatbot = await storage.getChatbotConfigByGuid(userId, guid);
      if (!existingChatbot) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      // Build system prompt for the prompt assistant
      let assistantPrompt = `You are an expert AI prompt engineer specializing in creating and improving system prompts for chatbots. Your role is to help users create effective, clear, and well-structured system prompts that will make their chatbots perform better.

Context about the chatbot:
- Name: ${context?.chatbotName || existingChatbot.name || 'Untitled Chatbot'}
- Description: ${context?.description || existingChatbot.description || 'No description provided'}
- Current System Prompt: ${context?.currentPrompt || existingChatbot.systemPrompt || 'No current prompt'}

Guidelines for creating effective system prompts:
1. Be specific about the chatbot's role and personality
2. Define the chatbot's knowledge domain and limitations
3. Specify the tone and communication style
4. Include instructions for handling edge cases
5. Keep it clear and concise while being comprehensive
6. Use examples when helpful

Response Format: Always respond with a single message bubble containing either:
- For "generate" action: A complete new system prompt
- For "improve" action: An improved version of the existing prompt with explanations
- For "chat" action: Helpful advice, suggestions, or answers to questions about prompt engineering

Be helpful, constructive, and provide actionable suggestions.`;

      // Handle different actions
      switch (action) {
        case 'generate':
          assistantPrompt += `\n\nUser Request: Generate a complete system prompt for this chatbot. Base it on the chatbot's name, description, and intended use case.

IMPORTANT FORMATTING: Provide your response as exactly 2 message bubbles:
1. First bubble: ONLY the clean, ready-to-use system prompt without any headers, explanations, or formatting markers
2. Second bubble: Your analysis and explanation of the prompt choices`;
          break;
        case 'improve':
          assistantPrompt += `\n\nUser Request: Analyze and improve the current system prompt. Provide the improved version and explain what changes were made and why.

IMPORTANT FORMATTING: Provide your response as exactly 2 message bubbles:
1. First bubble: ONLY the clean, improved system prompt without any headers, explanations, formatting markers, or prefixes like "**Improved System Prompt:**"
2. Second bubble: Your detailed explanation of what changes were made and why`;
          break;
        case 'chat':
          assistantPrompt += `\n\nUser Question: ${userMessage}`;
          break;
        default:
          return res.status(400).json({ message: "Invalid action. Must be 'generate', 'improve', or 'chat'" });
      }

      // Use the OpenAI service to generate response
      const sessionId = `prompt_assistant_${Date.now()}`;
      const conversationHistory: any[] = [];
      
      // Create a minimal chatbot config for the assistant
      const assistantConfig = {
        model: "gpt-4.1",
        temperature: 7,
        maxTokens: 2000,
        systemPrompt: assistantPrompt
      };

      const aiResponse = await generateMultiBubbleResponse(
        userMessage || `Please ${action} a system prompt for this chatbot.`,
        sessionId,
        conversationHistory,
        assistantConfig
      );

      res.json({
        success: true,
        response: aiResponse,
        action: action
      });

    } catch (error) {
      console.error("Error in prompt assistant:", error);
      res.status(500).json({ 
        message: "Failed to generate prompt assistance response",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}
