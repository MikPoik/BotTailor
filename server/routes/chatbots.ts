import type { Express } from "express";
import { storage } from "../storage";
import { insertChatbotConfigSchema, HomeScreenConfigSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { isAuthenticated } from "../replitAuth";

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

  // Get specific chatbot configuration
  app.get('/api/chatbots/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const chatbot = await storage.getChatbotConfig(parseInt(id));
      
      if (!chatbot || chatbot.userId !== userId) {
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

  // Update chatbot
  app.put('/api/chatbots/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const body = req.body;

      // Verify ownership
      const existingChatbot = await storage.getChatbotConfig(parseInt(id));
      if (!existingChatbot || existingChatbot.userId !== userId) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      const updateData = insertChatbotConfigSchema.partial().parse(body);
      const chatbot = await storage.updateChatbotConfig(parseInt(id), updateData);
      
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

  // Delete chatbot
  app.delete('/api/chatbots/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      // Verify ownership
      const existingChatbot = await storage.getChatbotConfig(parseInt(id));
      if (!existingChatbot || existingChatbot.userId !== userId) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      await storage.deleteChatbotConfig(parseInt(id));
      res.json({ message: "Chatbot deleted successfully" });
    } catch (error) {
      console.error("Error deleting chatbot:", error);
      res.status(500).json({ message: "Failed to delete chatbot" });
    }
  });

  // Update chatbot home screen configuration
  app.put('/api/chatbots/:id/home-screen', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { homeScreenConfig } = req.body;

      // Verify ownership
      const existingChatbot = await storage.getChatbotConfig(parseInt(id));
      if (!existingChatbot || existingChatbot.userId !== userId) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      // Validate home screen config
      const validatedConfig = HomeScreenConfigSchema.parse(homeScreenConfig);
      
      const updatedChatbot = await storage.updateChatbotConfig(parseInt(id), {
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
}