import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { generateHomeScreenConfig, modifyHomeScreenConfig } from "../ui-designer-service";
import { HomeScreenConfigSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

const GenerateRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  chatbotId: z.number().optional(),
});

const ModifyRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  currentConfig: HomeScreenConfigSchema,
  chatbotId: z.number().optional(),
});

export function setupUIDesignerRoutes(app: Express) {
  // POST /api/ui-designer/generate - Generate new home screen config
  app.post('/api/ui-designer/generate', isAuthenticated, async (req: any, res) => {
    try {
      const fullUserId = req.user.claims.sub;
      const userId = fullUserId.includes('|') ? fullUserId.split('|')[1] : fullUserId;
      const validatedData = GenerateRequestSchema.parse(req.body);
      
      console.log(`[UI DESIGNER] Generating new config for user: ${userId}`);
      
      const result = await generateHomeScreenConfig(validatedData.prompt, validatedData.chatbotId);
      
      // Handle both old format (just config) and new format (config + explanation)
      if (result.config) {
        res.json({ 
          config: result.config, 
          explanation: result.explanation 
        });
      } else {
        // Backward compatibility - treat result as config
        res.json({ config: result });
      }
    } catch (error) {
      console.error("Error generating home screen config:", error);
      
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate home screen configuration" 
      });
    }
  });

  // POST /api/ui-designer/modify - Modify existing home screen config
  app.post('/api/ui-designer/modify', isAuthenticated, async (req: any, res) => {
    try {
      const fullUserId = req.user.claims.sub;
      const userId = fullUserId.includes('|') ? fullUserId.split('|')[1] : fullUserId;
      
      // Pre-validate and sanitize the current config before schema validation
      let { currentConfig } = req.body;
      
      // Ensure currentConfig has required structure
      if (!currentConfig || typeof currentConfig !== 'object') {
        return res.status(400).json({ 
          message: "Invalid current configuration provided. Please reset the configuration and try again." 
        });
      }
      
      // Ensure components array exists
      if (!currentConfig.components || !Array.isArray(currentConfig.components)) {
        currentConfig.components = [];
      }
      
      // Sanitize each component's topics to ensure they're arrays
      currentConfig.components.forEach((component: any) => {
        if (component.props && component.props.topics && !Array.isArray(component.props.topics)) {
          component.props.topics = [];
        }
        if (component.props && component.props.actions && !Array.isArray(component.props.actions)) {
          component.props.actions = [];
        }
      });
      
      const validatedData = ModifyRequestSchema.parse({
        ...req.body,
        currentConfig
      });
      
      console.log(`[UI DESIGNER] Modifying config for user: ${userId}`);
      
      const result = await modifyHomeScreenConfig(
        validatedData.currentConfig,
        validatedData.prompt,
        validatedData.chatbotId
      );
      
      // Handle both old format (just config) and new format (config + explanation)
      if (result.config) {
        res.json({ 
          config: result.config, 
          explanation: result.explanation 
        });
      } else {
        // Backward compatibility - treat result as config
        res.json({ config: result });
      }
    } catch (error) {
      console.error("Error modifying home screen config:", error);
      
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: `Configuration validation failed: ${validationError.message}. Please reset the configuration and try again.`
        });
      }
      
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to modify home screen configuration" 
      });
    }
  });
}