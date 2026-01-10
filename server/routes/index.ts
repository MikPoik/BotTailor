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
import { setupContactRoutes } from "./contact";
import { setupEmbedRoutes } from "./embeds";
import { subscriptionRouter, webhookHandler } from "./subscription";
import ctaAiRouter from "./cta-ai";

// Main route registration function
export async function registerRoutes(app: Express): Promise<Server> {
  // Set up all route modules
  await setupAuthRoutes(app);
  setupChatRoutes(app);
  setupChatbotRoutes(app);
  setupSurveyRoutes(app);
  // Register embed routes BEFORE public routes to avoid /embed path conflicts
  setupEmbedRoutes(app);
  setupPublicRoutes(app);
  setupUploadRoutes(app);
  setupWebsiteRoutes(app);
  setupUIDesignerRoutes(app);
  setupContactRoutes(app);
  
  // CTA AI generation routes
  app.use('/api/cta', ctaAiRouter);
  
  // Webhook route (must be at /api/webhook for Stripe)
  app.use("/api/webhook", webhookHandler);
  
  // Subscription routes  
  app.use("/api/subscription", subscriptionRouter);

  // Create and return HTTP server
  const server = createServer(app);
  return server;
}