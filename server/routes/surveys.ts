import type { Express } from "express";
import { storage } from "../storage";
import { insertSurveySchema, SurveyConfigSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { isAuthenticated } from "../neonAuth";

// Survey management routes
export function setupSurveyRoutes(app: Express) {
  // Get all surveys for a chatbot
  app.get('/api/chatbots/:chatbotId/surveys', isAuthenticated, async (req: any, res) => {
    try {
      const { chatbotId } = req.params;
      const chatbotIdNum = Number(chatbotId);
      if (!Number.isInteger(chatbotIdNum)) {
        return res.status(400).json({ message: "Invalid chatbotId" });
      }
      const userId = req.neonUser.id;

      // Verify chatbot ownership
      const chatbot = await storage.getChatbotConfig(chatbotIdNum);
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
      const chatbotIdNum = Number(chatbotId);
      if (!Number.isInteger(chatbotIdNum)) {
        return res.status(400).json({ message: "Invalid chatbotId" });
      }
      const userId = req.neonUser.id;
      const body = req.body;

      // Verify chatbot ownership
      const chatbot = await storage.getChatbotConfig(chatbotIdNum);
      if (!chatbot || chatbot.userId !== userId) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      const surveyData = insertSurveySchema.parse({
        ...body,
        chatbotConfigId: chatbotIdNum,
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
      const chatbotIdNum = Number(chatbotId);
      const surveyIdNum = Number(surveyId);
      if (!Number.isInteger(chatbotIdNum) || !Number.isInteger(surveyIdNum)) {
        return res.status(400).json({ message: "Invalid chatbotId or surveyId" });
      }
      const userId = req.neonUser.id;
      const body = req.body;

      // Verify chatbot ownership
      const chatbot = await storage.getChatbotConfig(chatbotIdNum);
      if (!chatbot || chatbot.userId !== userId) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      // Verify survey belongs to this chatbot
      const existingSurvey = await storage.getSurvey(surveyIdNum);
      if (!existingSurvey || existingSurvey.chatbotConfigId !== chatbotIdNum) {
        return res.status(404).json({ message: "Survey not found" });
      }

      const updateData = insertSurveySchema.partial().parse(body);
      const survey = await storage.updateSurvey(surveyIdNum, updateData);

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
      const surveyIdNum = Number(surveyId);
      if (!Number.isInteger(surveyIdNum)) {
        return res.status(400).json({ message: "Invalid surveyId" });
      }
      const userId = req.neonUser.id;
      const body = req.body;

      // Get the existing survey first
      const existingSurvey = await storage.getSurvey(surveyIdNum);
      if (!existingSurvey) {
        return res.status(404).json({ message: "Survey not found" });
      }

      // Verify ownership through chatbot
      const chatbot = await storage.getChatbotConfig(existingSurvey.chatbotConfigId);
      if (!chatbot || chatbot.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updateData = insertSurveySchema.partial().parse(body);
      const survey = await storage.updateSurvey(surveyIdNum, updateData);

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

  // Delete all survey history (responses/sessions) for a chatbot
  // IMPORTANT: Place before the parameterized survey delete route to avoid route collision
  app.delete('/api/chatbots/:chatbotId/surveys/history', isAuthenticated, async (req: any, res) => {
    try {
      const { chatbotId } = req.params;
      const userId = req.neonUser.id;

      // Verify chatbot ownership (accept numeric ID or GUID)
      let chatbot = undefined as Awaited<ReturnType<typeof storage.getChatbotConfig>> | null;
      const chatbotIdNum = Number(chatbotId);
      if (Number.isInteger(chatbotIdNum)) {
        chatbot = await storage.getChatbotConfig(chatbotIdNum);
      } else {
        chatbot = await storage.getChatbotConfigByGuid(userId, chatbotId);
      }
      if (!chatbot || chatbot.userId !== userId) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      await storage.deleteAllSurveyHistory(chatbot.id);
      res.json({ message: "Survey history deleted successfully" });
    } catch (error) {
      console.error("Error deleting survey history:", error);
      res.status(500).json({ message: "Failed to delete survey history" });
    }
  });

  // Delete survey
  app.delete('/api/chatbots/:chatbotId/surveys/:surveyId', isAuthenticated, async (req: any, res) => {
    try {
      const { chatbotId, surveyId } = req.params;
      const chatbotIdNum = Number(chatbotId);
      const surveyIdNum = Number(surveyId);
      if (!Number.isInteger(chatbotIdNum) || !Number.isInteger(surveyIdNum)) {
        return res.status(400).json({ message: "Invalid chatbotId or surveyId" });
      }
      const userId = req.neonUser.id;

      // Verify chatbot ownership
      const chatbot = await storage.getChatbotConfig(chatbotIdNum);
      if (!chatbot || chatbot.userId !== userId) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      // Verify survey belongs to this chatbot
      const existingSurvey = await storage.getSurvey(surveyIdNum);
      if (!existingSurvey || existingSurvey.chatbotConfigId !== chatbotIdNum) {
        return res.status(404).json({ message: "Survey not found" });
      }

      await storage.deleteSurvey(surveyIdNum);
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
      const surveyIdNum = Number(surveyId);
      if (!Number.isInteger(surveyIdNum)) {
        return res.status(400).json({ message: "Invalid surveyId" });
      }

      // First deactivate any existing active survey sessions
      await storage.deactivateAllSurveySessions(sessionId);

      // Check if there's already a survey session for this specific survey
      const existingSurveySession = await storage.getSurveySession(surveyIdNum, sessionId);

      let surveySession;
      if (existingSurveySession) {
        // If survey exists and is completed, reset it for restart
        if (existingSurveySession.status === 'completed') {
          console.log(`[SURVEY_START] Restarting completed survey ${surveyIdNum} for session ${sessionId}`);
          surveySession = await storage.updateSurveySession(existingSurveySession.id, {
            currentQuestionIndex: 0,
            responses: {},
            status: 'active'
          });
        } else {
          // Reactivate the existing survey session
          console.log(`[SURVEY_START] Reactivating existing survey ${surveyIdNum} for session ${sessionId}`);
          surveySession = await storage.updateSurveySession(existingSurveySession.id, {
            status: 'active'
          });
        }
      } else {
        // Create new survey session
        console.log(`[SURVEY_START] Creating new survey session ${surveyIdNum} for session ${sessionId}`);
        surveySession = await storage.createSurveySession({
          surveyId: surveyIdNum,
          sessionId,
          currentQuestionIndex: 0,
          responses: {},
          status: 'active'
        });
      }

      // Set this survey as the active survey for the chat session
      await storage.setActiveSurvey(sessionId, surveyIdNum);
      console.log(`[SURVEY_START] Set survey ${surveyIdNum} as active for session ${sessionId}`);

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

      const surveySession = await storage.getActiveSurveySession(sessionId);
      if (!surveySession) {
        return res.status(404).json({ message: "Active survey session not found" });
      }

      const currentResponses = surveySession.responses && typeof surveySession.responses === 'object' ? surveySession.responses as any : {};
      const updatedResponses = { ...currentResponses, [questionId]: response };

      // Get survey config to check for completion
      const survey = await storage.getSurvey(surveySession.surveyId);
      const surveyConfig = survey?.surveyConfig as any;
      const totalQuestions = surveyConfig?.questions?.length || 0;
      const newQuestionIndex = (surveySession.currentQuestionIndex || 0) + 1;
      const isCompleted = newQuestionIndex >= totalQuestions;
      
      console.log(`[SURVEY COMPLETION] Question index will be ${newQuestionIndex}, total questions: ${totalQuestions}, isCompleted: ${isCompleted}`);

      const updatedSession = await storage.updateSurveySession(surveySession.id, {
        responses: updatedResponses,
        currentQuestionIndex: newQuestionIndex,
        status: isCompleted ? 'completed' : 'active',
        completedAt: isCompleted ? new Date() : surveySession.completedAt
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

      const surveySession = await storage.getActiveSurveySession(sessionId);
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

  // Survey Analytics endpoint  
  app.get('/api/chatbots/:chatbotId/surveys/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const { chatbotId } = req.params;
      const userId = req.neonUser.id;

      // Verify chatbot ownership (accept numeric ID or GUID)
      let chatbot = undefined as Awaited<ReturnType<typeof storage.getChatbotConfig>> | null;
      const chatbotIdNum = Number(chatbotId);
      if (Number.isInteger(chatbotIdNum)) {
        chatbot = await storage.getChatbotConfig(chatbotIdNum);
      } else {
        chatbot = await storage.getChatbotConfigByGuid(userId, chatbotId);
      }
      if (!chatbot || chatbot.userId !== userId) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      const analytics = await storage.getSurveyAnalyticsByChatbotGuid(chatbot.guid);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching survey analytics:", error);
      res.status(500).json({ message: "Failed to fetch survey analytics" });
    }
  });

  // Delete all survey history (responses/sessions) for a chatbot
  app.delete('/api/chatbots/:chatbotId/surveys/history', isAuthenticated, async (req: any, res) => {
    try {
      const { chatbotId } = req.params;
      const userId = req.neonUser.id;

      // Verify chatbot ownership (accept numeric ID or GUID)
      let chatbot = undefined as Awaited<ReturnType<typeof storage.getChatbotConfig>> | null;
      const chatbotIdNum = Number(chatbotId);
      if (Number.isInteger(chatbotIdNum)) {
        chatbot = await storage.getChatbotConfig(chatbotIdNum);
      } else {
        chatbot = await storage.getChatbotConfigByGuid(userId, chatbotId);
      }
      if (!chatbot || chatbot.userId !== userId) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      await storage.deleteAllSurveyHistory(chatbot.id);
      res.json({ message: "Survey history deleted successfully" });
    } catch (error) {
      console.error("Error deleting survey history:", error);
      res.status(500).json({ message: "Failed to delete survey history" });
    }
  });
}