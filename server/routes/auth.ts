import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../neonAuth";
import { db } from "../db";
import { neonAuthUsers } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";

// Authentication routes for Neon Auth
export async function setupAuthRoutes(app: Express) {
  // Helper to fetch Neon Auth user profile
  async function fetchNeonAuthUser(userId: string) {
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
  }

  // Get current user - lazy creation on first access
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.neonUser.id;
      
      // Try to get existing user from app database
      let user = await storage.getUser(userId);
      
      // If user doesn't exist, create them from Neon Auth data
      if (!user) {
        // Query neon_auth.users_sync for profile data
        const neonAuthUser = await fetchNeonAuthUser(userId);
        
        if (!neonAuthUser) {
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
        
        console.log(`[NEON AUTH] Created new user: ${userId}`);
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
      
      // Try to get existing user
      let user = await storage.getUser(userId);
      
      // If user doesn't exist, create them
      if (!user) {
        const neonAuthUser = await fetchNeonAuthUser(userId);
        
        if (!neonAuthUser) {
          return res.status(404).json({ message: "User not found in Neon Auth" });
        }

        user = await storage.upsertUser({
          id: userId,
          email: neonAuthUser.email || null,
          firstName: neonAuthUser.name || null,
          lastName: null,
          profileImageUrl: null,
        });
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
