import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../neonAuth";
import { db } from "../db";
import { neonAuthUsers } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";

// Development mode check
const isDevelopment = process.env.NODE_ENV !== "production";

// Authentication routes for Neon Auth
export async function setupAuthRoutes(app: Express) {
  // Helper to fetch Neon Auth user profile
  async function fetchNeonAuthUser(userId: string, profileData?: { email?: string; name?: string }) {
    // In development, use provided profile data or fallback to dummy data
    if (isDevelopment) {
      console.log(`[DEV MODE] Using ${profileData ? 'provided' : 'dummy'} Neon Auth user for ${userId}`);
      return {
        id: userId,
        name: profileData?.name || "Dev User",
        email: profileData?.email || "dev@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        rawJson: null,
      };
    }

    try {
      const [neonAuthUser] = await db
        .select()
        .from(neonAuthUsers)
        .where(
          and(
            eq(neonAuthUsers.id, userId),
            isNull(neonAuthUsers.deletedAt)
          )
        )
        .limit(1);
      return neonAuthUser;
    } catch (error) {
      // If query fails in production, log error and return null
      console.error("[NEON AUTH] Failed to query neon_auth.users_sync:", error);
      return null;
    }
  }

  // Get current user - lazy creation on first access
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.neonUser.id;
      console.log(`[AUTH] GET /api/auth/user for userId: ${userId}${isDevelopment ? ' (dev mode)' : ''}`);
      
      // Try to get existing user from app database
      let user = await storage.getUser(userId);
      
      if (user) {
        console.log(`[AUTH] User already exists in database: ${user.email || user.id}`);
      }
      
      // If user doesn't exist, create them from Neon Auth data
      if (!user) {
        // Extract profile data from query params (for dev mode)
        const profileData = isDevelopment ? {
          email: req.query.email as string,
          name: req.query.name as string,
        } : undefined;
        
        // Query neon_auth.users_sync for profile data (or use dev dummy data)
        const neonAuthUser = await fetchNeonAuthUser(userId, profileData);
        
        if (!neonAuthUser) {
          console.error(`[NEON AUTH] User not found: ${userId}`);
          return res.status(404).json({ message: "User not found in Neon Auth" });
        }

        // Create user in app database
        user = await storage.upsertUser({
          id: userId,
          email: neonAuthUser.email || null,
          firstName: neonAuthUser.name || null,
          lastName: null,
          profileImageUrl: null,
        });
        
        console.log(`[NEON AUTH] Created new user: ${userId}${isDevelopment ? ' (dev mode)' : ''}`);
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching/creating user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Ensure user exists endpoint (called on client initialization)
  app.post('/api/ensure-user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.neonUser.id;
      console.log(`[AUTH] POST /api/ensure-user for userId: ${userId}${isDevelopment ? ' (dev mode)' : ''}`);
      if (req.body?.email) {
        console.log(`[AUTH] Received profile data - email: ${req.body.email}, name: ${req.body.name}`);
      }
      
      // Try to get existing user
      let user = await storage.getUser(userId);
      
      if (user) {
        console.log(`[AUTH] User already exists in database: ${user.email || user.id}`);
      }
      
      // If user doesn't exist, create them
      if (!user) {
        // Extract profile data from request body (for dev mode)
        const profileData = isDevelopment && req.body ? {
          email: req.body.email as string,
          name: req.body.name as string,
        } : undefined;
        
        const neonAuthUser = await fetchNeonAuthUser(userId, profileData);
        
        if (!neonAuthUser) {
          console.error(`[NEON AUTH] User not found during ensure-user: ${userId}`);
          return res.status(404).json({ message: "User not found in Neon Auth" });
        }

        user = await storage.upsertUser({
          id: userId,
          email: neonAuthUser.email || null,
          firstName: neonAuthUser.name || null,
          lastName: null,
          profileImageUrl: null,
        });
        
        console.log(`[NEON AUTH] Ensured user exists: ${userId}${isDevelopment ? ' (dev mode)' : ''}`);
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error ensuring user:", error);
      res.status(500).json({ message: "Failed to ensure user" });
    }
  });

  // Check if current user is admin
  app.get('/api/auth/admin-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.neonUser.id;
      const adminUserId = process.env.DEFAULT_SITE_ADMIN_USER_ID;
      
      const isAdmin = adminUserId && userId === adminUserId;
      
      res.json({ isAdmin });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ message: "Failed to check admin status" });
    }
  });
}
