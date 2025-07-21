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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
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
}