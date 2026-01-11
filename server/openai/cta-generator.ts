import { getOpenAIClient } from './client';
import { CTAConfig, CTAConfigSchema } from '@shared/schema';

/**
 * CTA Generator Service
 * 
 * Uses OpenAI to generate complete CTA configurations from natural language prompts
 * Supports streaming generation for better UX
 */

const openai = getOpenAIClient();

const CTA_GENERATION_PROMPT = `You are a "Reactive Designer" AI. Your goal is to match the complexity of the CTA to the user's specific request.

CORE PRINCIPLES:
1. COMPLEXITY MATCHING: 
   - If the user asks for "simple", "minimal", or "basic", generate ONLY the core components requested.
   - For a "simple" request, usually 3 components are enough (Header, Description, Buttons).
   - Do NOT add badges, feature lists, or dividers unless explicitly requested.

2. LAYOUT PRESETS (Conceptual):
   - COMPACT: Use small paddings (8-16px), minimal font sizes, and 0-8px gaps. Omit badges and features.
   - STANDARD: Use balanced padding (24-32px), standard font sizes (16px), and 16-24px gaps.
   - HERO: Use large padding (40-64px), bold font sizes (24-32px), gradients, and background patterns.
   - Select the preset that best fits the user's tone.

3. CONTAINER & FLEXBOX USAGE:
   - Use the 'container' component type for complex groupings.
   - For side-by-side buttons or elements, use a 'container' with style: { "display": "flex", "flexDirection": "row", "gap": 12, "justifyContent": "center" }.
   - Prefer structured components over 'custom_html' unless the layout is impossible otherwise.

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
