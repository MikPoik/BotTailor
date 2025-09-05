import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuthRoutes } from "./auth";
import { setupChatRoutes } from "./chat";
import { setupChatbotRoutes } from "./chatbots";
import { setupSurveyRoutes } from "./surveys";
import { setupPublicRoutes } from "./public";
import { setupUploadRoutes } from "./uploads";
import { setupWebsiteRoutes } from "./websites";
import { setupUIDesignerRoutes } from "./ui-designer";
import { subscriptionRouter } from "./subscription";

// Main route registration function
export async function registerRoutes(app: Express): Promise<Server> {
  // Set up all route modules
  await setupAuthRoutes(app);
  setupChatRoutes(app);
  setupChatbotRoutes(app);
  setupSurveyRoutes(app);
  setupPublicRoutes(app);
  setupUploadRoutes(app);
  setupWebsiteRoutes(app);
  setupUIDesignerRoutes(app);
  
  // Subscription routes
  app.use("/api/subscription", subscriptionRouter);

  // Create and return HTTP server
  const server = createServer(app);
  return server;
}