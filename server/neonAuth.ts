import type { Express, RequestHandler } from "express";

/**
 * Neon Auth middleware for extracting user information from Stack Auth headers
 * Stack Auth automatically includes x-stack-user-id header when user is authenticated
 */
export const neonAuthMiddleware: RequestHandler = async (req, res, next) => {
  const userId = req.headers['x-stack-user-id'] as string;
  
  if (userId) {
    // Attach user info to request for downstream handlers
    (req as any).neonUser = { id: userId };
  }
  
  next();
};

/**
 * Middleware to require authentication
 * Returns 401 if user is not authenticated
 */
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const userId = req.headers['x-stack-user-id'] as string;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  (req as any).neonUser = { id: userId };
  next();
};

/**
 * Setup Neon Auth middleware on the Express app
 */
export async function setupNeonAuth(app: Express) {
  // Apply Neon Auth middleware globally
  app.use(neonAuthMiddleware);
  
  console.log('[NEON AUTH] Middleware configured');
}
