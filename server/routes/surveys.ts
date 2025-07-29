import type { Express } from "express";
import { storage } from "../storage";
import { insertSurveySchema, SurveyConfigSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { isAuthenticated } from "../replitAuth";

// Survey management routes
export function setupSurveyRoutes(app: Express) {
  // Get all surveys for a chatbot
  app.get('/api/chatbots/:chatbotId/surveys', isAuthenticated, async (req: any, res) => {
    try {
      const { chatbotId } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify chatbot ownership
      const chatbot = await storage.getChatbotConfig(parseInt(chatbotId));
      if (!chatbot || chatbot.userId !== userId) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      const surveys = await storage.getSurveys(parseInt(chatbotId));
      res.json(surveys);
    } catch (error) {
      console.error("Error fetching surveys:", error);
      res.status(500).json({ message: "Failed to fetch surveys" });
    }
  });

  // Create new survey
  app.post('/api/chatbots/:chatbotId/surveys', isAuthenticated, async (req: any, res) => {
    try {
      const { chatbotId } = req.params;
      const userId = req.user.claims.sub;
      const body = req.body;

      // Verify chatbot ownership
      const chatbot = await storage.getChatbotConfig(parseInt(chatbotId));
      if (!chatbot || chatbot.userId !== userId) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      const surveyData = insertSurveySchema.parse({
        ...body,
        chatbotConfigId: parseInt(chatbotId),
      });

      const survey = await storage.createSurvey(surveyData);
      res.json(survey);
    } catch (error) {
      console.error("Error creating survey:", error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create survey" });
    }
  });

  // Update survey
  app.put('/api/chatbots/:chatbotId/surveys/:surveyId', isAuthenticated, async (req: any, res) => {
    try {
      const { chatbotId, surveyId } = req.params;
      const userId = req.user.claims.sub;
      const body = req.body;

      // Verify chatbot ownership
      const chatbot = await storage.getChatbotConfig(parseInt(chatbotId));
      if (!chatbot || chatbot.userId !== userId) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      // Verify survey belongs to this chatbot
      const existingSurvey = await storage.getSurvey(parseInt(surveyId));
      if (!existingSurvey || existingSurvey.chatbotConfigId !== parseInt(chatbotId)) {
        return res.status(404).json({ message: "Survey not found" });
      }

      const updateData = insertSurveySchema.partial().parse(body);
      const survey = await storage.updateSurvey(parseInt(surveyId), updateData);
      
      res.json(survey);
    } catch (error) {
      console.error("Error updating survey:", error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update survey" });
    }
  });

  // Update survey (simplified endpoint for direct survey updates)
  app.patch('/api/surveys/:surveyId', isAuthenticated, async (req: any, res) => {
    try {
      const { surveyId } = req.params;
      const userId = req.user.claims.sub;
      const body = req.body;

      // Get the existing survey first
      const existingSurvey = await storage.getSurvey(parseInt(surveyId));
      if (!existingSurvey) {
        return res.status(404).json({ message: "Survey not found" });
      }

      // Verify ownership through chatbot
      const chatbot = await storage.getChatbotConfig(existingSurvey.chatbotConfigId);
      if (!chatbot || chatbot.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updateData = insertSurveySchema.partial().parse(body);
      const survey = await storage.updateSurvey(parseInt(surveyId), updateData);
      
      res.json(survey);
    } catch (error) {
      console.error("Error updating survey:", error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update survey" });
    }
  });

  // Delete survey
  app.delete('/api/chatbots/:chatbotId/surveys/:surveyId', isAuthenticated, async (req: any, res) => {
    try {
      const { chatbotId, surveyId } = req.params;
      const userId = req.user.claims.sub;

      // Verify chatbot ownership
      const chatbot = await storage.getChatbotConfig(parseInt(chatbotId));
      if (!chatbot || chatbot.userId !== userId) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      // Verify survey belongs to this chatbot
      const existingSurvey = await storage.getSurvey(parseInt(surveyId));
      if (!existingSurvey || existingSurvey.chatbotConfigId !== parseInt(chatbotId)) {
        return res.status(404).json({ message: "Survey not found" });
      }

      await storage.deleteSurvey(parseInt(surveyId));
      res.json({ message: "Survey deleted successfully" });
    } catch (error) {
      console.error("Error deleting survey:", error);
      res.status(500).json({ message: "Failed to delete survey" });
    }
  });

  // Survey session management
  app.post('/api/survey-sessions/start-survey', async (req, res) => {
    try {
      const { sessionId, surveyId } = req.body;

      const surveySession = await storage.createSurveySession({
        surveyId,
        sessionId,
        currentQuestionIndex: 0,
        responses: {},
        status: 'active'
      });

      res.json(surveySession);
    } catch (error) {
      console.error("Error starting survey session:", error);
      res.status(500).json({ message: "Failed to start survey session" });
    }
  });

  // Record survey response
  app.post('/api/survey-sessions/response', async (req, res) => {
    try {
      const { sessionId, questionId, response } = req.body;

      const surveySession = await storage.getSurveySessionBySessionId(sessionId);
      if (!surveySession) {
        return res.status(404).json({ message: "Survey session not found" });
      }

      const updatedResponses = { ...surveySession.responses, [questionId]: response };
      
      const updatedSession = await storage.updateSurveySession(surveySession.id, {
        responses: updatedResponses,
        currentQuestionIndex: surveySession.currentQuestionIndex + 1
      });

      res.json(updatedSession);
    } catch (error) {
      console.error("Error recording survey response:", error);
      res.status(500).json({ message: "Failed to record survey response" });
    }
  });

  // Get survey session status
  app.get('/api/survey-sessions/:sessionId/status', async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const surveySession = await storage.getSurveySessionBySessionId(sessionId);
      if (!surveySession) {
        return res.json({ hasSurvey: false });
      }

      res.json({
        hasSurvey: true,
        surveySession
      });
    } catch (error) {
      console.error("Error fetching survey session status:", error);
      res.status(500).json({ message: "Failed to fetch survey session status" });
    }
  });
}