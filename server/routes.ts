// Legacy routes file - now using modular structure in routes/ directory
// This file is kept for backward compatibility and will be gradually phased out

import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerRoutes as registerModularRoutes } from "./routes/index";

export async function registerRoutes(app: Express): Promise<Server> {
  // Use the new modular route structure
  return await registerModularRoutes(app);
}