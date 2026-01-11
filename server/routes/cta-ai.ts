import { Router, Request, Response } from 'express';
import { generateCTAFromPrompt, generateCTAWithStreaming } from '../openai/cta-generator';
import { isAuthenticated } from '../neonAuth';
import { z } from 'zod';

const router = Router();

// Schema for CTA generation request
const generateCTASchema = z.object({
  prompt: z.string().min(3, 'Prompt must be at least 3 characters'),
  chatbotName: z.string().optional(),
  stream: z.boolean().default(false),
  currentConfig: z.any().optional(),
  messages: z.array(z.object({ role: z.enum(['user','assistant']), content: z.string() })).optional(),
});

/**
 * POST /api/cta/generate
 * Generate a CTA configuration from a natural language prompt
 */
router.post('/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const body = generateCTASchema.parse(req.body);

    // If streaming is requested, set up SSE
    if (body.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
        const composedPrompt = body.currentConfig || body.messages?.length
          ? `You are updating an existing CTA configuration.
          
CRITICAL: You MUST preserve all existing components (especially headers and titles) unless explicitly asked to remove them. If the user asks for a style change (like background color), keep all content components (header, buttons, etc.) intact.

Current CTA config:
${JSON.stringify(body.currentConfig ?? {}, null, 2)}

Chat history (latest first):
${(body.messages ?? []).map(m => `- ${m.role}: ${m.content}`).join('\n')}

User request:
${body.prompt}

Please return the FULL updated CTAConfig JSON that incorporates the request while strictly maintaining all existing content components unless removal was requested.`
          : body.prompt;

        const { config, description } = await generateCTAWithStreaming(
          composedPrompt,
          body.chatbotName,
          (chunk) => {
            // Send chunk as server-sent event
            res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
          }
        );

        // Send final config
        res.write(
          `data: ${JSON.stringify({ type: 'complete', config, description })}\n\n`
        );
        res.end();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Generation failed';
        res.write(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`);
        res.end();
      }
    } else {
      // Non-streaming response
      const composedPrompt = body.currentConfig || body.messages?.length
        ? `You are updating an existing CTA configuration. 
        
CRITICAL: You MUST preserve all existing components (especially headers and titles) unless explicitly asked to remove them. If the user asks for a style change (like background color), keep all content components (header, buttons, etc.) intact.

Current CTA config:
${JSON.stringify(body.currentConfig ?? {}, null, 2)}

Chat history (latest first):
${(body.messages ?? []).map(m => `- ${m.role}: ${m.content}`).join('\n')}

User request:
${body.prompt}

Please return the FULL updated CTAConfig JSON that incorporates the request while strictly maintaining all existing content components unless removal was requested.`
        : body.prompt;

      const { config, description } = await generateCTAFromPrompt(
        composedPrompt,
        body.chatbotName
      );

      res.json({
        success: true,
        config,
        description,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: error.errors,
      });
    }

    const errorMessage = error instanceof Error ? error.message : 'Generation failed';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * POST /api/cta/refine
 * Refine an existing CTA based on feedback
 */
router.post('/refine', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { currentConfig, feedback, chatbotName } = req.body;

    if (!feedback) {
      return res.status(400).json({
        success: false,
        error: 'Feedback is required',
      });
    }

    const refinementPrompt = `
The user has an existing CTA configuration and wants to refine it.

Current CTA structure:
${JSON.stringify(currentConfig, null, 2)}

User feedback/request:
${feedback}

Please generate an updated CTAConfig that incorporates this feedback while maintaining the overall structure.
    `;

    const { config, description } = await generateCTAFromPrompt(
      refinementPrompt,
      chatbotName
    );

    res.json({
      success: true,
      config,
      description: `Updated based on your feedback: ${feedback}. ${description}`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Refinement failed';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

export default router;
