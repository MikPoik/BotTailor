import type { Express } from "express";
import { storage } from "../storage";
import { insertWebsiteSourceSchema, type WebsiteSource } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { isAuthenticated } from "../replitAuth";
import { WebsiteScanner } from "../website-scanner";

// Website content management routes
export function setupWebsiteRoutes(app: Express) {
  // Get website sources for a chatbot
  app.get('/api/chatbots/:chatbotId/website-sources', isAuthenticated, async (req: any, res) => {
    try {
      const { chatbotId } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify chatbot ownership
      const chatbot = await storage.getChatbotConfig(parseInt(chatbotId));
      if (!chatbot || chatbot.userId !== userId) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      const sources = await storage.getWebsiteSources(parseInt(chatbotId));
      res.json(sources);
    } catch (error) {
      console.error("Error fetching website sources:", error);
      res.status(500).json({ message: "Failed to fetch website sources" });
    }
  });

  // Add new website source
  app.post('/api/chatbots/:chatbotId/website-sources', isAuthenticated, async (req: any, res) => {
    try {
      const { chatbotId } = req.params;
      const userId = req.user.claims.sub;
      const { url, name } = req.body;

      // Verify chatbot ownership
      const chatbot = await storage.getChatbotConfig(parseInt(chatbotId));
      if (!chatbot || chatbot.userId !== userId) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      const sourceData = insertWebsiteSourceSchema.parse({
        chatbotConfigId: parseInt(chatbotId),
        url,
        name: name || url,
        status: 'pending' as const,
        lastScanned: null
      });

      const source = await storage.createWebsiteSource(sourceData);

      // Start scanning in the background
      const scanner = new WebsiteScanner();
      scanner.scanWebsite(source.id).catch(error => {
        console.error("Background scanning failed:", error);
      });

      res.json(source);
    } catch (error) {
      console.error("Error creating website source:", error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to add website source" });
    }
  });

  // Delete website source
  app.delete('/api/chatbots/:chatbotId/website-sources/:sourceId', isAuthenticated, async (req: any, res) => {
    try {
      const { chatbotId, sourceId } = req.params;
      const userId = req.user.claims.sub;

      // Verify chatbot ownership
      const chatbot = await storage.getChatbotConfig(parseInt(chatbotId));
      if (!chatbot || chatbot.userId !== userId) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      // Verify source belongs to this chatbot
      const source = await storage.getWebsiteSource(parseInt(sourceId));
      if (!source || source.chatbotConfigId !== parseInt(chatbotId)) {
        return res.status(404).json({ message: "Website source not found" });
      }

      await storage.deleteWebsiteSource(parseInt(sourceId));
      res.json({ message: "Website source deleted successfully" });
    } catch (error) {
      console.error("Error deleting website source:", error);
      res.status(500).json({ message: "Failed to delete website source" });
    }
  });

  // Rescan website source
  app.post('/api/chatbots/:chatbotId/website-sources/:sourceId/rescan', isAuthenticated, async (req: any, res) => {
    try {
      const { chatbotId, sourceId } = req.params;
      const userId = req.user.claims.sub;

      // Verify chatbot ownership
      const chatbot = await storage.getChatbotConfig(parseInt(chatbotId));
      if (!chatbot || chatbot.userId !== userId) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      // Verify source belongs to this chatbot
      const source = await storage.getWebsiteSource(parseInt(sourceId));
      if (!source || source.chatbotConfigId !== parseInt(chatbotId)) {
        return res.status(404).json({ message: "Website source not found" });
      }

      // Update status to scanning
      await storage.updateWebsiteSource(parseInt(sourceId), { 
        status: 'scanning' as const 
      });

      // Start scanning in the background
      const scanner = new WebsiteScanner();
      scanner.scanWebsite(parseInt(sourceId)).catch(error => {
        console.error("Background rescanning failed:", error);
      });

      res.json({ message: "Rescanning started" });
    } catch (error) {
      console.error("Error rescanning website source:", error);
      res.status(500).json({ message: "Failed to start rescanning" });
    }
  });
}