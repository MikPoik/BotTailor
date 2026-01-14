/**
 * Legacy routes entry point (backward compatibility).
 *
 * Responsibilities:
 * - Delegates to modular route registration in server/routes/index.ts.
 * - Kept for backward compatibility; new routes should use modular structure.
 *
 * Constraints & Edge Cases:
 * - Will be phased out; do not add new logic here.
 * - All route registration is handled by server/routes/index.ts.
 */

import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerRoutes as registerModularRoutes } from "./routes/index";

export async function registerRoutes(app: Express): Promise<Server> {
  // Use the new modular route structure
  return await registerModularRoutes(app);
}