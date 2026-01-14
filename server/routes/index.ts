/**
 * Modular API route registration for all backend domains.
 *
 * Responsibilities:
 * - Registers all route modules (auth, chat, chatbots, surveys, embeds, uploads, websites, UI designer, contact, public, subscription, CTA AI, webhooks).
 * - Ensures correct route ordering (e.g., embeds before public, webhooks at /api/webhook).
 * - Returns the HTTP server instance for use by the main app entry.
 *
 * Constraints & Edge Cases:
 * - Route registration order matters for path conflicts and middleware (see embeds/public, webhooks).
 * - All new routes must be registered here to be exposed via the API.
 */
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

/**
 * Registers all modular API routes on the Express app.
 * Route order is critical for path conflicts and middleware (see embeds/public, webhooks).
 * Returns the HTTP server instance.
 * @param app Express app
 * @returns HTTP server
 */
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
  
  // Webhook route (must be at /api/webhook for Stripe signature verification)
  app.use("/api/webhook", webhookHandler);
  
  // Subscription routes
  app.use("/api/subscription", subscriptionRouter);

  // Create and return HTTP server
  const server = createServer(app);
  return server;
}