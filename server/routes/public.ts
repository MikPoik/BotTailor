import type { Express } from "express";
import { storage } from "../storage";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Public API routes (no authentication required)
export function setupPublicRoutes(app: Express) {
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

  // Serve embedded widget
  app.get('/embed/:guid?', async (req, res) => {
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
        req.chatWidgetConfig = { guid };
      }

      res.send(html);
    } catch (error) {
      console.error("Error serving embed widget:", error);
      res.status(500).send('Error loading chat widget');
    }
  });
}