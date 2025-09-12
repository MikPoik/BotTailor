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
      const userId = req.user.claims.sub;
      const validatedData = GenerateRequestSchema.parse(req.body);
      
      console.log(`[UI DESIGNER] Generating new config for user: ${userId}`);
      
      const config = await generateHomeScreenConfig(validatedData.prompt, validatedData.chatbotId);
      
      res.json({ config });
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
      const userId = req.user.claims.sub;
      const validatedData = ModifyRequestSchema.parse(req.body);
      
      console.log(`[UI DESIGNER] Modifying config for user: ${userId}`);
      
      const config = await modifyHomeScreenConfig(
        validatedData.currentConfig,
        validatedData.prompt,
        validatedData.chatbotId
      );
      
      res.json({ config });
    } catch (error) {
      console.error("Error modifying home screen config:", error);
      
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to modify home screen configuration" 
      });
    }
  });
}