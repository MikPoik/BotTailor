import type { Express } from "express";
import { storage } from "../storage";
import { insertWebsiteSourceSchema, type WebsiteSource } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { isAuthenticated } from "../replitAuth";
import { WebsiteScanner } from "../website-scanner";
import { uploadTextFile } from "../upload-service";

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

  // Add new content source (website, text, or file)
  app.post('/api/chatbots/:chatbotId/website-sources', isAuthenticated, async (req: any, res) => {
    try {
      const { chatbotId } = req.params;
      const userId = req.user.claims.sub;
      const { sourceType = 'website', url, title, description, textContent, fileName, maxPages } = req.body;

      // Verify chatbot ownership
      const chatbot = await storage.getChatbotConfig(parseInt(chatbotId));
      if (!chatbot || chatbot.userId !== userId) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      // Validate based on source type
      if (sourceType === 'website' && !url) {
        return res.status(400).json({ message: "URL is required for website sources" });
      }
      if ((sourceType === 'text' || sourceType === 'file') && !textContent) {
        return res.status(400).json({ message: "Text content is required for text/file sources" });
      }

      const sourceData = insertWebsiteSourceSchema.parse({
        chatbotConfigId: parseInt(chatbotId),
        sourceType,
        url: sourceType === 'website' ? url : undefined,
        title: title || (sourceType === 'website' ? url : fileName || 'Text Content'),
        description,
        textContent: sourceType !== 'website' ? textContent : undefined,
        fileName: sourceType === 'file' ? fileName : undefined,
        maxPages: sourceType === 'website' ? maxPages : undefined,
        status: 'pending' as const,
        lastScanned: null
      });

      const source = await storage.createWebsiteSource(sourceData);

      // Start processing in the background
      const scanner = new WebsiteScanner();
      if (sourceType === 'website') {
        scanner.scanWebsite(source.id).catch(error => {
          console.error("Background scanning failed:", error);
        });
      } else {
        // Process text content directly
        scanner.processTextContent(source.id, sourceData.title || 'Text Content', textContent).catch(error => {
          console.error("Background text processing failed:", error);
        });
      }

      res.json(source);
    } catch (error) {
      console.error("Error creating content source:", error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to add content source" });
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
        return res.status(404).json({ message: "Content source not found" });
      }

      await storage.deleteWebsiteSource(parseInt(sourceId));
      res.json({ message: "Website source deleted successfully" });
    } catch (error) {
      console.error("Error deleting website source:", error);
      res.status(500).json({ message: "Failed to delete website source" });
    }
  });

  // Rescan/reprocess content source
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
        return res.status(404).json({ message: "Content source not found" });
      }

      // Update status to scanning
      await storage.updateWebsiteSource(parseInt(sourceId), { 
        status: 'scanning' as const 
      });

      // Start processing in the background based on source type
      const scanner = new WebsiteScanner();
      if (source.sourceType === 'website') {
        scanner.scanWebsite(parseInt(sourceId)).catch(error => {
          console.error("Background rescanning failed:", error);
        });
      } else {
        // Reprocess text content
        if (source.textContent) {
          scanner.processTextContent(parseInt(sourceId), source.title || 'Text Content', source.textContent).catch(error => {
            console.error("Background text reprocessing failed:", error);
          });
        } else {
          // Mark as error if no text content available
          await storage.updateWebsiteSource(parseInt(sourceId), {
            status: 'error' as const,
            errorMessage: 'No text content available for reprocessing'
          });
        }
      }

      res.json({ message: source.sourceType === 'website' ? "Rescanning started" : "Reprocessing started" });
    } catch (error) {
      console.error("Error reprocessing content source:", error);
      res.status(500).json({ message: "Failed to start reprocessing" });
    }
  });

  // Upload text file and add as content source
  app.post('/api/chatbots/:chatbotId/upload-text-file', isAuthenticated, uploadTextFile.single('file'), async (req: any, res) => {
    try {
      const { chatbotId } = req.params;
      const userId = req.user.claims.sub;
      const file = req.file;
      const { title, description } = req.body;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Verify chatbot ownership
      const chatbot = await storage.getChatbotConfig(parseInt(chatbotId));
      if (!chatbot || chatbot.userId !== userId) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      // Extract text content from file buffer
      const textContent = file.buffer.toString('utf-8');
      
      if (!textContent.trim()) {
        return res.status(400).json({ message: "File appears to be empty or unreadable" });
      }

      const sourceData = insertWebsiteSourceSchema.parse({
        chatbotConfigId: parseInt(chatbotId),
        sourceType: 'file',
        title: title || file.originalname,
        description: description || `Uploaded file: ${file.originalname}`,
        textContent,
        fileName: file.originalname,
        status: 'pending' as const,
        lastScanned: null
      });

      const source = await storage.createWebsiteSource(sourceData);

      // Process text content directly
      const scanner = new WebsiteScanner();
      scanner.processTextContent(source.id, sourceData.title || file.originalname, textContent).catch(error => {
        console.error("Background text file processing failed:", error);
      });

      res.json({
        ...source,
        message: "File uploaded successfully and processing started"
      });
    } catch (error) {
      console.error("Error uploading text file:", error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to upload text file" });
    }
  });
}