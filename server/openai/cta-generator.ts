import { getOpenAIClient } from './client';
import { CTAConfig, CTAConfigSchema } from '@shared/schema';

/**
 * CTA Generator Service
 * 
 * Uses OpenAI to generate complete CTA configurations from natural language prompts
 * Supports streaming generation for better UX
 */

const openai = getOpenAIClient();

const CTA_GENERATION_PROMPT = `You are a world-class UI/UX designer. Your task is to generate a CTA (Call-to-Action) configuration JSON based on the user's request.

COMPLEXITY MATCHING (CRITICAL):
- If the user asks for "simple" or "minimal", generate ONLY the core components requested (e.g., just header, description, and buttons). 
- Do NOT add badges, feature lists, or dividers unless explicitly requested or necessary for the specific layout.
- Match the visual complexity to the user's intent.

LAYOUT & SPACING GUIDELINES:
- Use 'card' style for general purpose, 'banner' for top/bottom strips, 'modal' for overlays.
- Use the 'Container' component type to group related elements if needed.
- For side-by-side buttons, ensure they are handled within the button group logic or a container.
- Keep component orders logical (Header -> Description -> Features -> Form -> Buttons).
- Avoid overcrowding. If more than 4 components are generated, ensure they are concise.

STYLING ARCHITECTURE (HYBRID):
- You have full access to flexbox and grid properties via the 'style' object.
- Use 'textAlign': 'center' for centered layouts.
- Use 'display': 'flex', 'flexDirection': 'row', 'gap': 12 for horizontal groupings.
- All colors should be hex codes that match the requested theme.

The CTAConfig schema structure:
{
  "version": "1.0",
  "enabled": true,
  "layout": {
    "style": "card" | "banner" | "modal" | "sidebar",
    "position": "top" | "center" | "bottom",
    "width": "full" | "wide" | "narrow",
    "backgroundPattern": "dots" | "grid" | "waves" | "stripes" | "none"
  },
  "components": [
    {
      "id": "unique_id",
      "type": "header" | "description" | "feature_list" | "badge" | "divider" | "container" | "richtext" | "form",
      "order": number,
      "style": {
        "display": "block" | "flex" | "grid",
        "flexDirection": "row" | "column",
        "gap": number,
        "padding": number,
        "margin": number,
        "marginBottom": number,
        "textAlign": "left" | "center" | "right",
        "fontSize": number,
        "fontWeight": number,
        "borderRadius": number,
        "backgroundColor": "#hex",
        "textColor": "#hex"
      },
      "props": { ... }
    }
  ],
  "primaryButton": {
    "id": "btn_primary",
    "text": "string",
    "variant": "solid" | "outline" | "ghost",
    "style": { "borderRadius": number, "backgroundColor": "#hex" }
  },
  "secondaryButton": {
    "id": "btn_secondary",
    "text": "string",
    "action": "close" | "link" | "none",
    "url": "string"
  }
}

USER REQUEST:
`;

/**
 * Generate a CTA configuration from a natural language prompt
 */
function normalizeCTAConfig(config: any): any {
  const c = { ...config };
  if (c.enabled === undefined) c.enabled = true;
  if (c.secondaryButton) {
    if (!c.secondaryButton.action) {
      c.secondaryButton.action = 'none';
    }
    if (c.secondaryButton.action === 'link' && !c.secondaryButton.url) {
      c.secondaryButton.url = '#';
    }
  }
  return c;
}

export async function generateCTAFromPrompt(
  prompt: string,
  chatbotName?: string
): Promise<{ config: CTAConfig; description: string }> {
  try {
    const systemPrompt = CTA_GENERATION_PROMPT + `\nThe chatbot/application name is: ${chatbotName || 'Support'}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-5.1', //Newest, dont change
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_completion_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '';

    // Extract JSON from response (handle markdown code blocks)
    let jsonString = content;
    const jsonMatch = content.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    }

    // Parse and validate the generated config
    const parsedConfig = JSON.parse(jsonString);
    const normalized = normalizeCTAConfig(parsedConfig);
    const validatedConfig = CTAConfigSchema.parse(normalized);

    // Generate description of what was created
    const description = `I've created a ${validatedConfig.layout?.style || 'card'}-style CTA with:
- Layout: ${validatedConfig.layout?.position || 'center'} positioned
- ${validatedConfig.components?.length || 0} content components
- Primary button: "${validatedConfig.primaryButton?.text || 'Start'}"
- Theme colors configured

This is now ready to preview and customize further!`;

    return {
      config: validatedConfig,
      description,
    };
  } catch (error) {
    console.error('CTA generation error:', error);
    throw new Error(
      `Failed to generate CTA: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate CTA with streaming support
 */
export async function generateCTAWithStreaming(
  prompt: string,
  chatbotName?: string,
  onChunk?: (chunk: string) => void
): Promise<{ config: CTAConfig; description: string }> {
  try {
    const systemPrompt = CTA_GENERATION_PROMPT + `\nThe chatbot/application name is: ${chatbotName || 'Support'}`;

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      stream: true,
    });

    let fullContent = '';

    // Collect all chunks
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullContent += content;
      onChunk?.(content);
    }

    // Parse and validate
    let jsonString = fullContent;
    const jsonMatch = fullContent.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    }

    const parsedConfig = JSON.parse(jsonString);
    const normalized = normalizeCTAConfig(parsedConfig);
    const validatedConfig = CTAConfigSchema.parse(normalized);

    const description = `I've created a ${validatedConfig.layout?.style || 'card'}-style CTA with:
- Layout: ${validatedConfig.layout?.position || 'center'} positioned
- ${validatedConfig.components?.length || 0} content components
- Primary button: "${validatedConfig.primaryButton?.text || 'Start'}"
- Theme colors configured`;

    return {
      config: validatedConfig,
      description,
    };
  } catch (error) {
    console.error('CTA streaming generation error:', error);
    throw new Error(
      `Failed to generate CTA: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
