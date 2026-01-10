import { getOpenAIClient } from './client';
import { CTAConfig, CTAConfigSchema } from '@shared/schema';

/**
 * CTA Generator Service
 * 
 * Uses OpenAI to generate complete CTA configurations from natural language prompts
 * Supports streaming generation for better UX
 */

const openai = getOpenAIClient();

const CTA_GENERATION_PROMPT = `You are an expert UI/UX designer specializing in Call-to-Action (CTA) design.
Your task is to generate a complete CTA configuration JSON based on the user's request.

The user will describe what kind of CTA they want, and you must generate a valid CTAConfig JSON object.

IMPORTANT: You MUST return ONLY valid JSON that matches this schema. No markdown, no extra text.

The CTAConfig schema structure:
{
  "version": "1.0",
  "enabled": true,
  "layout": {
    "style": "card" | "banner" | "modal" | "sidebar",
    "position": "top" | "center" | "bottom",
    "width": "full" | "wide" | "narrow",
    "backgroundPattern": "dots" | "grid" | "waves" | "stripes" | "none",
    "backgroundOverlay": {
      "enabled": boolean,
      "color": "#hexcolor",
      "opacity": 0-1
    }
  },
  "components": [
    {
      "id": "unique_id",
      "type": "header" | "description" | "feature_list" | "badge" | "divider" | "container" | "richtext" | "form",
      "order": number,
      "visible": true,
      "style": {
        "backgroundColor": "#hexcolor",
        "textColor": "#hexcolor",
        "fontSize": number,
        "padding": number,
        "borderRadius": number,
        "boxShadow": "string",
        "gradient": {
          "enabled": boolean,
          "type": "linear" | "radial",
          "angle": 0-360,
          "startColor": "#hexcolor",
          "endColor": "#hexcolor"
        }
      },
      "props": {
        "title": "string",
        "subtitle": "string",
        "description": "string",
        "features": [
          {
            "icon": "emoji or unicode",
            "title": "string",
            "description": "string"
          }
        ],
        "htmlContent": "string for richtext"
      }
    }
  ],
  "primaryButton": {
    "id": "btn_primary",
    "text": "Button text",
    "variant": "solid" | "outline" | "ghost",
    "predefinedMessage": "Message to send",
    "actionLabel": "Label",
    "style": {
      "backgroundColor": "#hexcolor",
      "textColor": "#hexcolor",
      "borderRadius": number
    }
  },
  "secondaryButton": {
    "id": "btn_secondary",
    "text": "Button text",
    "action": "close" | "link" | "none",
    "url": "https://..." // required when action = "link"
  },
  "theme": {
    "primaryColor": "#hexcolor",
    "backgroundColor": "#hexcolor",
    "textColor": "#hexcolor",
    "accentColor": "#hexcolor"
  },
  "settings": {
    "dismissible": boolean,
    "showOncePerSession": boolean
  }
}

DESIGN GUIDELINES:
- Use modern, clean design principles
- Include appropriate spacing and sizing
- Use gradients, shadows, and modern styling
- Create visually appealing layouts
- Use emojis for badges and features
- Match colors and themes cohesively
- Make CTAs mobile-friendly
- Include 2-5 components that work together

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
