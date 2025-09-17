import type { Express } from "express";
import { storage } from "../storage";
import { setupAuth, isAuthenticated } from "../replitAuth";
import passport from "passport";

// Authentication routes
export async function setupAuthRoutes(app: Express) {
  // Set up authentication middleware
  await setupAuth(app);

  // Get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const fullUserId = req.user.claims.sub;
      // Extract clean ID (remove provider prefix if present)
      const cleanUserId = fullUserId.includes('|') ? fullUserId.split('|')[1] : fullUserId;
      
      // Try to get existing user
      let user = await storage.getUser(cleanUserId);
      
      // If user doesn't exist, create them with clean ID format
      if (!user) {
        const provider = fullUserId.includes('|') ? fullUserId.split('|')[0] : 'unknown';
        const userProfile = req.user.claims;
        
        user = await storage.upsertUser({
          id: cleanUserId,
          provider: provider,
          firstName: userProfile.given_name || userProfile.name || userProfile.nickname || 'Unknown',
          lastName: userProfile.family_name || '',
          email: userProfile.email || '',
          profileImageUrl: userProfile.picture || ''
        });
        
        console.log(`[AUTH] Created new user: ${cleanUserId} (provider: ${provider})`);
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching/creating user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Login route
  app.post('/api/auth/login', passport.authenticate('local'), (req: any, res) => {
    res.json({ message: "Login successful", user: req.user });
  });

  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err: any) => {
      if (err) {
        console.error("Error logging out:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Auth callback route (for OAuth providers)
  app.get('/api/auth/callback', 
    passport.authenticate('replit-auth', { failureRedirect: '/api/auth/failure' }),
    (req, res) => {
      // Successful authentication
      res.redirect('/');
    }
  );

  // Auth failure route
  app.get('/api/auth/failure', (req, res) => {
    res.status(401).json({ message: "Authentication failed" });
  });

  // Check if current user is admin
  app.get('/api/auth/admin-status', isAuthenticated, async (req: any, res) => {
    try {
      const fullUserId = req.user.claims.sub;
      const userId = fullUserId.includes('|') ? fullUserId.split('|')[1] : fullUserId;
      const adminUserId = process.env.DEFAULT_SITE_ADMIN_USER_ID;
      
      const isAdmin = adminUserId && userId === adminUserId;
      
      res.json({ isAdmin });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ message: "Failed to check admin status" });
    }
  });
}
