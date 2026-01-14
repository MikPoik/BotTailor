/**
 * Main entry point for the Express/Node server.
 *
 * Responsibilities:
 * - Configures core middleware, CORS (for embed widget), and logging.
 * - Handles webhook raw body parsing (for Stripe and other signature verification) before JSON parsing.
 * - Registers modular API routes and sets up authentication (Neon Auth).
 * - Orchestrates SSR/static serving via Vite in dev and static assets in production.
 * - Ensures correct middleware ordering for webhooks and CORS, and proper error handling.
 *
 * Constraints & Edge Cases:
 * - Webhook routes under /api/webhook require raw body for signature verification; must precede JSON parsing.
 * - CORS is permissive to allow embed usage across origins.
 * - In production, fly.dev domains are redirected to APP_URL.
 * - Vite dev middleware is only enabled in development after all other routes.
 * - All environment variables (e.g., APP_URL, NODE_ENV) must be set correctly for proper operation.
 */
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupNeonAuth } from "./neonAuth";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Handle webhook routes BEFORE JSON parsing to preserve raw body for Stripe signature verification
// Webhook routes must be handled before JSON parsing to preserve raw body for signature verification (e.g., Stripe)
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// Apply JSON parsing to all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable trust proxy for correct client IP forwarding (important for proxies/load balancers)
app.set('trust proxy', true);

// Configure CORS to allow cross-origin requests for the embed widget
// (Permissive: allows all origins, required for embeddable chat widget)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Stack-User-Id', 'x-stack-user-id']
}));

// Log all API requests and responses with timing and status for observability
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Setup Neon Auth middleware (handles authentication and session validation)
  await setupNeonAuth(app);

  // In production, redirect fly.dev development domains to canonical APP_URL
  if (process.env.NODE_ENV === 'production' && process.env.APP_URL) {
    app.use((req, res, next) => {
      const host = req.get('Host');
      if (host && host.includes('fly.dev')) {
        const redirectUrl = process.env.APP_URL + req.originalUrl;
        return res.redirect(301, redirectUrl);
      }
      next();
    });
  }

  // Register all modular API routes (see server/routes/*)
  const server = await registerRoutes(app);

  // Centralized error handler for all routes
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Serve static files in production, or enable Vite dev middleware in development
  // Vite must be set up after all other routes to avoid catch-all conflicts
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();