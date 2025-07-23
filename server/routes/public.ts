import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to find the correct path for static files in both dev and prod
function findStaticFilePath(filename: string): string | null {
  // Try production path first (dist/public)
  const prodPath = path.resolve(__dirname, '../dist/public', filename);
  if (fs.existsSync(prodPath)) {
    return prodPath;
  }
  
  // Try development path (public)
  const devPath = path.resolve(__dirname, '../../public', filename);
  if (fs.existsSync(devPath)) {
    return devPath;
  }
  
  // Try alternative production path (./public relative to server)
  const altProdPath = path.resolve(__dirname, '../public', filename);
  if (fs.existsSync(altProdPath)) {
    return altProdPath;
  }
  
  return null;
}

// Public API routes (no authentication required)
export function setupPublicRoutes(app: Express) {
  // Serve embed.js static file (handle both with and without trailing slash)
  app.get('/embed.js', (req: Request, res: Response) => {
    const embedPath = findStaticFilePath('embed.js');
    
    if (embedPath) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(embedPath);
    } else {
      console.error('embed.js not found. Searched paths:', [
        path.resolve(__dirname, '../dist/public/embed.js'),
        path.resolve(__dirname, '../../public/embed.js'),
        path.resolve(__dirname, '../public/embed.js')
      ]);
      res.status(404).send('embed.js not found');
    }
  });

  // Handle trailing slash version as well
  app.get('/embed.js/', (req: Request, res: Response) => {
    const embedPath = findStaticFilePath('embed.js');
    
    if (embedPath) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(embedPath);
    } else {
      console.error('embed.js not found. Searched paths:', [
        path.resolve(__dirname, '../dist/public/embed.js'),
        path.resolve(__dirname, '../../public/embed.js'),
        path.resolve(__dirname, '../public/embed.js')
      ]);
      res.status(404).send('embed.js not found');
    }
  });

  // Serve embed.css static file
  app.get('/embed.css', (req: Request, res: Response) => {
    const embedCssPath = findStaticFilePath('embed.css');
    
    if (embedCssPath) {
      res.setHeader('Content-Type', 'text/css');
      res.sendFile(embedCssPath);
    } else {
      console.error('embed.css not found. Searched paths:', [
        path.resolve(__dirname, '../dist/public/embed.css'),
        path.resolve(__dirname, '../../public/embed.css'),
        path.resolve(__dirname, '../public/embed.css')
      ]);
      res.status(404).send('embed.css not found');
    }
  });
  // Get default chatbot configuration for public access
  app.get('/api/public/default-chatbot', async (req, res) => {
    try {
      const defaultGuid = process.env.DEFAULT_SITE_CHATBOT_GUID;
      const defaultUserId = process.env.DEFAULT_SITE_ADMIN_USER_ID;

      if (!defaultGuid || !defaultUserId) {
        return res.status(404).json({ 
          message: "Default chatbot not configured",
          hint: "Set DEFAULT_SITE_CHATBOT_GUID and DEFAULT_SITE_ADMIN_USER_ID environment variables"
        });
      }

      console.log(`[DEFAULT CHATBOT] Serving default chatbot: ${defaultGuid} for admin user: ${defaultUserId}`);

      const chatbotConfig = await storage.getChatbotConfigByGuid(defaultUserId, defaultGuid);
      if (!chatbotConfig) {
        return res.status(404).json({ 
          message: "Default chatbot configuration not found",
          hint: `No chatbot found with GUID ${defaultGuid} for user ${defaultUserId}`
        });
      }

      console.log(`[DEFAULT CHATBOT] Serving default chatbot: ${chatbotConfig.name} (GUID: ${chatbotConfig.guid}) for admin user: ${defaultUserId}`);

      res.json(chatbotConfig);
    } catch (error) {
      console.error("Error fetching default chatbot:", error);
      res.status(500).json({ message: "Failed to fetch default chatbot configuration" });
    }
  });

  // Get surveys available for public home screen
  app.get('/api/public/surveys', async (req, res) => {
    try {
      const defaultGuid = process.env.DEFAULT_SITE_CHATBOT_GUID;
      const defaultUserId = process.env.DEFAULT_SITE_ADMIN_USER_ID;

      if (!defaultGuid || !defaultUserId) {
        return res.json([]);
      }

      const chatbotConfig = await storage.getChatbotConfigByGuid(defaultUserId, defaultGuid);
      if (!chatbotConfig) {
        return res.json([]);
      }

      const surveys = await storage.getSurveys(chatbotConfig.id);
      res.json(surveys);
    } catch (error) {
      console.error("Error fetching public surveys:", error);
      res.json([]);
    }
  });

  // Public API to get chatbot configuration for embed widget
  app.get("/api/public/chatbot/:userId/:chatbotGuid", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, chatbotGuid } = req.params;

      console.log(`Fetching public chatbot config for userId: ${userId}, chatbotGuid: ${chatbotGuid}`);

      // Get chatbot config from database
      const chatbotConfig = await storage.getChatbotConfigByGuid(userId, chatbotGuid);
      if (!chatbotConfig || !chatbotConfig.isActive) {
        console.log(`Chatbot not found or inactive: ${chatbotGuid}`);
        return res.status(404).json({ error: 'Chatbot not found or inactive' });
      }

      // Return only the public configuration data needed for the embed widget
      const publicConfig = {
        id: chatbotConfig.id,
        guid: chatbotConfig.guid,
        name: chatbotConfig.name,
        avatarUrl: chatbotConfig.avatarUrl,
        initialMessages: chatbotConfig.initialMessages || [],
        welcomeMessage: chatbotConfig.welcomeMessage
      };

      res.json(publicConfig);
    } catch (error) {
      console.error("Error fetching public chatbot config:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Embed route with optional GUID parameter
  app.get("/embed/:guid?", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { guid } = req.params;
      let html = '';

      // Determine path to static files based on environment
      const isProduction = process.env.NODE_ENV === 'production';
      const staticPath = isProduction ? 
        path.join(__dirname, '../../../dist/public') : 
        path.join(__dirname, '../../public');

      const embedPath = path.join(staticPath, 'embed.html');

      if (fs.existsSync(embedPath)) {
        html = fs.readFileSync(embedPath, 'utf-8');
      } else {
        // Fallback HTML if embed.html doesn't exist
        html = `
<!DOCTYPE html>
<html>
<head>
    <title>Chat Widget</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <div id="chat-widget-container" style="height: 100vh;"></div>
    <script src="/embed.js${guid ? `?guid=${guid}` : ''}"></script>
</body>
</html>`;
      }

      // If a specific GUID is requested, add it to the widget config
      if (guid) {
        (req as any).chatWidgetConfig = { guid };
      }

      res.send(html);
    } catch (error) {
      console.error("Error serving embed widget:", error);
      res.status(500).send('Error loading chat widget');
    }
  });
  // Chat widget route with user and chatbot parameters - only match specific patterns
  app.get("/widget/:userId/:chatbotGuid", async (req, res, next) => {
    try {
      const { userId, chatbotGuid } = req.params;
      const { embedded = "true", mobile = "false" } = req.query;

      console.log(`Loading widget for userId: ${userId}, chatbotGuid: ${chatbotGuid}`);

      // Get chatbot config from database
      const chatbotConfig = await storage.getChatbotConfigByGuid(userId, chatbotGuid);
      if (!chatbotConfig || !chatbotConfig.isActive) {
        console.log(`Chatbot not found or inactive: ${chatbotGuid}`);
        return res.status(404).send('Chatbot not found or inactive');
      }

      console.log(`Found chatbot config: ${chatbotConfig.name}`);

      const sessionId = req.query.sessionId as string || `embed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const isMobile = req.query.mobile === 'true';
      const isEmbedded = req.query.embedded === 'true';

      // Force HTTPS in production environments
      const protocol = process.env.NODE_ENV === "production" ? 'https' : req.protocol;
      const apiUrl = protocol + '://' + req.get('host');

      console.log(`Environment: ${process.env.NODE_ENV}, Protocol: ${protocol}, API URL: ${apiUrl}`);

      if (process.env.NODE_ENV === "production") {
        const distPath = path.resolve(__dirname, "../../../dist/public");
        const htmlPath = path.join(distPath, 'index.html');

        console.log(`Looking for HTML file at: ${htmlPath}`);
        console.log(`File exists: ${fs.existsSync(htmlPath)}`);

        let html;
        if (!fs.existsSync(htmlPath)) {
          console.log(`HTML file not found, trying alternative paths...`);
          // Try different possible paths
          const alternativePaths = [
            path.resolve(__dirname, "./public/index.html"),
            path.resolve(__dirname, "../public/index.html"), 
            path.resolve(__dirname, "dist/public/index.html"),
            path.resolve(process.cwd(), "dist/public/index.html")
          ];

          let found = false;
          for (const altPath of alternativePaths) {
            console.log(`Trying: ${altPath} - exists: ${fs.existsSync(altPath)}`);
            if (fs.existsSync(altPath)) {
              html = fs.readFileSync(altPath, 'utf8');
              console.log(`Successfully loaded HTML from: ${altPath}`);
              found = true;
              break;
            }
          }

          if (!found) {
            return res.status(500).send('HTML template not found');
          }
        } else {
          html = fs.readFileSync(htmlPath, 'utf8');
        }

        // Inject session data and chatbot config into the HTML
        const sessionData = `
          <script>
            window.__CHAT_WIDGET_CONFIG__ = {
              sessionId: "${sessionId}",
              apiUrl: "${apiUrl}",
              isMobile: ${isMobile},
              embedded: ${isEmbedded},
              chatbotConfig: ${JSON.stringify(chatbotConfig)}
            };
          </script>
        `;

        html = html.replace('</head>', `${sessionData}</head>`);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } else {
        // In development, inject config and let Vite dev server handle the rest
        req.url = '/';
        (req as any).chatWidgetConfig = {
          sessionId,
          apiUrl,
          isMobile,
          embedded: isEmbedded,
          chatbotConfig
        };
        next();
      }
    } catch (error) {
      console.error('Error serving chatbot widget:', error);
      res.status(500).send('Internal server error');
    }
  });
}