import type { Express, Request, Response, NextFunction } from "express";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  createEmbedDesign,
  getEmbedDesignById,
  getEmbedDesignByEmbedId,
  getEmbedDesignsByChatbot,
  updateEmbedDesign,
  deleteEmbedDesign,
  updateComponentVisibility,
  getEmbedDesignForRendering,
  CreateEmbedDesignInput,
  UpdateEmbedDesignInput,
} from "../embed-service";
import { storage } from "../storage";
import { isAuthenticated } from "../neonAuth";

export function setupEmbedRoutes(app: Express) {
  // Ensure ESM-compatible __dirname resolution
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // ============================================
  // PUBLIC ROUTES (No authentication)
  // ============================================

  /**
   * GET /api/public/embed/:embedId
   * Get embed design configuration by public embed ID
   * Used by iframe to fetch configuration
   */
  app.get("/api/public/embed/:embedId", async (req: Request, res: Response) => {
    try {
      const { embedId } = req.params;

      const design = await getEmbedDesignForRendering(embedId);
      if (!design) {
        return res.status(404).json({ error: "Embed design not found or inactive" });
      }

      // Return only necessary data for rendering
      res.json({
        embedId: design.embedId,
        designType: design.designType,
        theme: {
          primaryColor: design.primaryColor,
          backgroundColor: design.backgroundColor,
          textColor: design.textColor,
        },
        ui: {
          welcomeMessage: design.welcomeMessage,
          welcomeType: design.welcomeType,
          inputPlaceholder: design.inputPlaceholder,
          showAvatar: design.showAvatar,
          showTimestamp: design.showTimestamp,
          headerText: design.headerText,
          footerText: design.footerText,
          hideBranding: design.hideBranding,
          chatbotConfig: {
            avatarUrl: design.chatbotConfig?.avatarUrl,
            name: design.chatbotConfig?.name,
          },
        },
        components: design.components?.map((c: any) => ({
          name: c.componentName,
          visible: c.isVisible,
          order: c.componentOrder,
        })) || [],
        chatbotConfigId: design.chatbotConfigId,
        chatbotGuid: design.chatbotConfig?.guid,
        chatbotName: design.chatbotConfig?.name,
        ctaConfig: design.ctaConfig, // NEW: Return CTA config
      });
    } catch (error) {
      console.error("Error fetching embed configuration:", error);
      res.status(500).json({ error: "Failed to fetch embed configuration" });
    }
  });

  /**
   * GET /embed/:embedId
   * Render the embed page with iframe content
   * Public route - no authentication required
   */
  app.get("/embed/:embedId", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { embedId } = req.params;
      const { sessionId, mobile } = req.query;

      const design = await getEmbedDesignForRendering(embedId);
      if (!design) {
        return res.status(404).send("Embed not found or inactive");
      }

      // Generate or use provided session ID
      // Prefer native UUID when available, otherwise generate RFC4122 v4
      const finalSessionId = (sessionId as string) || (typeof globalThis !== 'undefined' && (globalThis as any).crypto && (globalThis as any).crypto.randomUUID
        ? (globalThis as any).crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c: string) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          }));
      const isMobile = mobile === "true";

      // Extract theme colors
      const theme = {
        primaryColor: design.primaryColor || "#2563eb",
        backgroundColor: design.backgroundColor || "#ffffff",
        textColor: design.textColor || "#1f2937",
      };

      // Force HTTPS in production
      const protocol = process.env.NODE_ENV === "production" ? "https" : req.protocol;
      const apiUrl = protocol + "://" + req.get("host");

      if (process.env.NODE_ENV === "production") {
        const distPath = path.resolve(__dirname, "../../../dist/public");
        const htmlPath = path.join(distPath, "index.html");

        let html: string = "";
        if (!fs.existsSync(htmlPath)) {
          const alternativePaths = [
            path.resolve(__dirname, "./public/index.html"),
            path.resolve(__dirname, "../public/index.html"),
            path.resolve(__dirname, "dist/public/index.html"),
            path.resolve(process.cwd(), "dist/public/index.html"),
          ];

          let found = false;
          for (const altPath of alternativePaths) {
            if (fs.existsSync(altPath)) {
              html = fs.readFileSync(altPath, "utf8");
              found = true;
              break;
            }
          }

          if (!found) {
            return res.status(500).send("HTML template not found");
          }
        } else {
          html = fs.readFileSync(htmlPath, "utf8");
        }

        // Preload CTA background image (if present) to avoid a repaint/flash when it finishes loading
        const preloadLink = design.ctaConfig && design.ctaConfig.layout && design.ctaConfig.layout.backgroundImage
          ? `<link rel="preload" href="${design.ctaConfig.layout.backgroundImage}" as="image">`
          : ``;

        // Inject session data and embed config into the HTML
        const sessionData = `${preloadLink}
          <style>
            :root {
              --embed-primary: ${theme.primaryColor};
              --embed-bg: ${theme.backgroundColor};
              --embed-text: ${theme.textColor};
            }
            html, body, #root {
              margin: 0;
              padding: 0;
              overflow: hidden;
            }
          </style>
          <script>
            window.__EMBED_CONFIG__ = {
              embedId: "${embedId}",
              sessionId: "${finalSessionId}",
              apiUrl: "${apiUrl}",
              isMobile: ${isMobile},
              embedded: true,
              designType: "${design.designType}",
              theme: ${JSON.stringify(theme)},
              ui: ${JSON.stringify({
                welcomeMessage: design.welcomeMessage,
                welcomeType: design.welcomeType,
                inputPlaceholder: design.inputPlaceholder,
                showAvatar: design.showAvatar,
                showTimestamp: design.showTimestamp,
                headerText: design.headerText,
                footerText: design.footerText,
                hideBranding: design.hideBranding,
                chatbotConfig: {
                  avatarUrl: design.chatbotConfig?.avatarUrl,
                  name: design.chatbotConfig?.name,
                },
              })},
              ctaConfig: ${JSON.stringify(design.ctaConfig)},
              components: ${JSON.stringify(
                design.components?.map((c: any) => ({
                  name: c.componentName,
                  visible: c.isVisible,
                })) || []
              )},
              chatbotConfigId: ${design.chatbotConfigId ?? 'null'},
              chatbotGuid: "${design.chatbotConfig?.guid}"
            };
          </script>
        `;

        html = html.replace("</head>", `${sessionData}</head>`);
        res.setHeader("Content-Type", "text/html");
        res.send(html);
      } else {
        // Development mode: let Vite serve client app, inject embed config
        (req as any).embedConfig = {
          embedId,
          sessionId: finalSessionId,
          apiUrl,
          isMobile,
          embedded: true,
          designType: design.designType,
          theme,
          ui: {
            welcomeMessage: design.welcomeMessage,
            welcomeType: design.welcomeType,
            inputPlaceholder: design.inputPlaceholder,
            showAvatar: design.showAvatar,
            showTimestamp: design.showTimestamp,
            headerText: design.headerText,
            footerText: design.footerText,
            hideBranding: design.hideBranding,
            chatbotConfig: {
              avatarUrl: design.chatbotConfig?.avatarUrl,
              name: design.chatbotConfig?.name,
            },
          },
          ctaConfig: design.ctaConfig, // NEW: Pass CTA config
          components: design.components,
          chatbotGuid: design.chatbotConfig?.guid,
          chatbotConfigId: design.chatbotConfigId ?? null,
        };
        // Hand off to Vite middleware to render SPA route /embed/:embedId
        return next();
      }
    } catch (error) {
      console.error("Error serving embed:", error);
      res.status(500).send("Internal server error");
    }
  });

  // ============================================
  // AUTHENTICATED ROUTES (Require authentication)
  // ============================================

  /**
   * POST /api/chatbots/:guid/embeds
   * Create a new embed design for a chatbot
   */
  app.post("/api/chatbots/:guid/embeds", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { guid } = req.params;
      const userId = (req as any).neonUser.id;
      const { name, description, designType, theme, ui, ctaConfig } = req.body;

      // Get chatbot config
      const chatbot = await storage.getChatbotConfigByGuid(userId, guid);
      if (!chatbot) {
        return res.status(404).json({ error: "Chatbot not found" });
      }

      // Create embed design
      const design = await createEmbedDesign({
        chatbotConfigId: chatbot.id,
        userId,
        name,
        description,
        designType,
        primaryColor: theme?.primaryColor,
        backgroundColor: theme?.backgroundColor,
        textColor: theme?.textColor,
        welcomeMessage: ui?.welcomeMessage,
        welcomeType: ui?.welcomeType,
        inputPlaceholder: ui?.inputPlaceholder,
        showAvatar: ui?.showAvatar,
        showTimestamp: ui?.showTimestamp,
        headerText: ui?.headerText,
        footerText: ui?.footerText,
        hideBranding: ui?.hideBranding,
        ctaConfig, // NEW: Pass CTA config
      });

      res.json(design);
    } catch (error) {
      console.error("Error creating embed design:", error);
      res.status(500).json({ error: "Failed to create embed design" });
    }
  });

  /**
   * GET /api/chatbots/:guid/embeds
   * Get all embed designs for a chatbot
   */
  app.get("/api/chatbots/:guid/embeds", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { guid } = req.params;
      const userId = (req as any).neonUser.id;

      // Get chatbot config
      const chatbot = await storage.getChatbotConfigByGuid(userId, guid);
      if (!chatbot) {
        return res.status(404).json({ error: "Chatbot not found" });
      }

      const designs = await getEmbedDesignsByChatbot(chatbot.id, userId);
      res.json(designs);
    } catch (error) {
      console.error("Error fetching embed designs:", error);
      res.status(500).json({ error: "Failed to fetch embed designs" });
    }
  });

  /**
   * GET /api/chatbots/:guid/embeds/:embedId
   * Get a specific embed design
   */
  app.get("/api/chatbots/:guid/embeds/:embedId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { guid, embedId } = req.params;
      const userId = (req as any).neonUser.id;

      // Get chatbot config
      const chatbot = await storage.getChatbotConfigByGuid(userId, guid);
      if (!chatbot) {
        return res.status(404).json({ error: "Chatbot not found" });
      }

      // Get embed by public ID and verify ownership
      const design = await getEmbedDesignByEmbedId(embedId);
      if (!design || design.userId !== userId || design.chatbotConfigId !== chatbot.id) {
        return res.status(404).json({ error: "Embed design not found" });
      }

      res.json(design);
    } catch (error) {
      console.error("Error fetching embed design:", error);
      res.status(500).json({ error: "Failed to fetch embed design" });
    }
  });

  /**
   * PUT /api/chatbots/:guid/embeds/:embedId
   * Update an embed design
   */
  app.put("/api/chatbots/:guid/embeds/:embedId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { guid, embedId } = req.params;
      const userId = (req as any).neonUser.id;
      const { name, description, designType, theme, ui, isActive, ctaConfig } = req.body;

      // Get chatbot config
      const chatbot = await storage.getChatbotConfigByGuid(userId, guid);
      if (!chatbot) {
        return res.status(404).json({ error: "Chatbot not found" });
      }

      // Get embed and verify ownership
      const design = await getEmbedDesignByEmbedId(embedId);
      if (!design || design.userId !== userId || design.chatbotConfigId !== chatbot.id) {
        return res.status(404).json({ error: "Embed design not found" });
      }

      const updated = await updateEmbedDesign(design.id, userId, {
        name,
        description,
        designType,
        primaryColor: theme?.primaryColor,
        backgroundColor: theme?.backgroundColor,
        textColor: theme?.textColor,
        welcomeMessage: ui?.welcomeMessage,
        welcomeType: ui?.welcomeType,
        inputPlaceholder: ui?.inputPlaceholder,
        showAvatar: ui?.showAvatar,
        showTimestamp: ui?.showTimestamp,
        headerText: ui?.headerText,
        footerText: ui?.footerText,
        hideBranding: ui?.hideBranding,
        ctaConfig, // NEW: Pass CTA config
        isActive,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating embed design:", error);
      res.status(500).json({ error: "Failed to update embed design" });
    }
  });

  /**
   * DELETE /api/chatbots/:guid/embeds/:embedId
   * Delete an embed design
   */
  app.delete("/api/chatbots/:guid/embeds/:embedId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { guid, embedId } = req.params;
      const userId = (req as any).neonUser.id;

      // Get chatbot config
      const chatbot = await storage.getChatbotConfigByGuid(userId, guid);
      if (!chatbot) {
        return res.status(404).json({ error: "Chatbot not found" });
      }

      // Get embed and verify ownership
      const design = await getEmbedDesignByEmbedId(embedId);
      if (!design || design.userId !== userId || design.chatbotConfigId !== chatbot.id) {
        return res.status(404).json({ error: "Embed design not found" });
      }

      const deleted = await deleteEmbedDesign(design.id, userId);
      res.json({ success: true, deleted });
    } catch (error) {
      console.error("Error deleting embed design:", error);
      res.status(500).json({ error: "Failed to delete embed design" });
    }
  });

  /**
   * PATCH /api/chatbots/:guid/embeds/:embedId/components/:componentName
   * Update component visibility
   */
  app.patch(
    "/api/chatbots/:guid/embeds/:embedId/components/:componentName",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const { guid, embedId, componentName } = req.params;
        const { isVisible } = req.body;
        const userId = (req as any).neonUser.id;

        // Get chatbot config
        const chatbot = await storage.getChatbotConfigByGuid(userId, guid);
        if (!chatbot) {
          return res.status(404).json({ error: "Chatbot not found" });
        }

        // Get embed and verify ownership
        const design = await getEmbedDesignByEmbedId(embedId);
        if (!design || design.userId !== userId || design.chatbotConfigId !== chatbot.id) {
          return res.status(404).json({ error: "Embed design not found" });
        }

        const updated = await updateComponentVisibility(design.id, componentName, isVisible, userId);
        res.json(updated);
      } catch (error) {
        console.error("Error updating component visibility:", error);
        res.status(500).json({ error: "Failed to update component visibility" });
      }
    }
  );
}
