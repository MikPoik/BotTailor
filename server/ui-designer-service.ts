/**
 * UI Designer artifact persistence and config generation service.
 *
 * Responsibilities:
 * - Persists and versions designer artifacts (JSON layout, components, theme, settings, version).
 * - Generates, modifies, and validates HomeScreenConfig objects for chatbot home screens.
 * - Integrates with OpenAI for config generation and with DB for artifact storage.
 *
 * Contracts & Edge Cases:
 * - Artifacts must include: version, components[], theme, settings (see docs/agents/ui-designer.md).
 * - All components require: id, type, order, visible, props (with type-specific fields).
 * - Server endpoints must return artifact id, version, and last-modified/version info.
 * - All config/schema changes must be coordinated with shared/schema.ts and client embed consumers.
 * - Idempotent save endpoints; optimistic concurrency via version/ETag.
 * - Backwards-incompatible changes require migration/versioning and embed.js compatibility.
 */
import OpenAI from "openai";
import { z } from "zod";
import { HomeScreenConfigSchema, type HomeScreenConfig } from "@shared/schema";

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// UI Designer system prompt
function createSystemPrompt(availableSurveys: any[] = []) {
  const surveyInfo =
    availableSurveys.length > 0
      ? `\n\n## Available Surveys for Integration:\n${availableSurveys
          .map((s) => `- Survey ID: ${s.id} - "${s.title}" (${s.description})`)
          .join("\n")}`
      : "";

  return `You are an expert UI designer that creates home screen configurations for chatbots. You generate JSON configurations that define the layout, components, and styling of chatbot home screens.

Your goal is to create engaging, user-friendly home screens that help users quickly find what they're looking for and start meaningful conversations with the chatbot.

## Available Component Types:

1. **header** - Welcome message and branding
   - Props: title, subtitle

2. **category_tabs** - Horizontal tabs for filtering topics
   - Props: categories (array of strings)

3. **topic_grid** - Grid of clickable topic cards
   - Props: topics (array with id, title, description, icon, category, message, actionType, surveyId)

4. **quick_actions** - Prominent action buttons
   - Props: actions (array with id, title, description, action, actionType, surveyId)

5. **footer** - Bottom section with additional info
   - Props: title, subtitle

## Component Properties:

### Topics in topic_grid:
- id: unique identifier
- title: display name
- description: brief explanation
- icon: icon name (e.g., "MessageCircle", "Phone", "CreditCard", "Star", "BarChart")
- category: grouping category
- message: what gets sent when clicked (for message types)
- actionType: "message", "survey", or "custom" (default: "message")
- surveyId: reference to survey ID (required when actionType is "survey")
- popular: boolean for highlighting

### Actions in quick_actions:
- id: unique identifier  
- title: action name
- description: what the action does
- action: action type (e.g., "start_chat", "contact_agent", "take_assessment")
- actionType: "message", "survey", or "custom" (default: "message")
- surveyId: reference to survey ID (required when actionType is "survey")

## Survey Integration:
When creating survey launchers, use:
- actionType: "survey"
- surveyId: valid survey ID from available surveys
- action: "take_assessment" or "start_survey"
- Appropriate icons: "Star", "BarChart", "PieChart", "TrendingUp"
- Clear descriptions indicating it's a survey/assessment${surveyInfo}

## Styling Guidelines:
- Use modern, clean designs
- Ensure good contrast and readability
- Make interactive elements clearly clickable
- Use appropriate spacing and typography
- Consider mobile-first responsive design

## Response Format:
Return a JSON object containing two keys: "config" and "explanation".
- "config": A valid JSON object that matches the HomeScreenConfig schema.
- "explanation": A short condensed natural language explanation of the generated UI.
No additional text or explanation outside of these keys.

**CRITICAL REQUIREMENTS:**
- Every component MUST have an "id" field (unique string identifier)
- Every component MUST have an "order" field (numeric position starting from 1)
- Every component MUST have a "visible" field (boolean, typically true)
- Every component MUST have a "type" field matching the available types
- Every component MUST have a "props" field (object with component-specific properties)
- The root "config" object MUST have a "components" field (array of components)
- The root "config" object MUST have a "version" field (string, typically "1.0")

**EXAMPLE STRUCTURE:**
{
  "config": {
    "version": "1.0",
    "components": [
      {
        "id": "header_1",
        "type": "header",
        "props": {
          "title": "Welcome",
          "subtitle": "How can we help?"
        },
        "order": 1,
        "visible": true
      }
    ],
    "theme": {},
    "settings": {}
  },
  "explanation": "This is a simple welcome screen with a header."
}

Generate engaging home screen layouts based on the user's requirements.`;
}

export async function generateHomeScreenConfig(
  userPrompt: string,
  chatbotId?: number,
): Promise<{ config: HomeScreenConfig; explanation: string | null }> {
  try {
    // Fetch available surveys if chatbotId is provided
    let availableSurveys: any[] = [];
    if (chatbotId) {
      const { db } = await import("./db");
      const { surveys } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");

      const surveyResults = await db
        .select()
        .from(surveys)
        .where(
          and(
            eq(surveys.chatbotConfigId, chatbotId),
            eq(surveys.status, "active"),
          ),
        );

      availableSurveys = surveyResults.map((survey) => ({
        id: survey.id,
        name: survey.name,
        title: (survey.surveyConfig as any)?.title || survey.name,
        description: survey.description,
      }));
    }

    console.log(`[UI Designer] Found ${availableSurveys.length} available surveys for chatbot ${chatbotId}`);

    const response = await openai.chat.completions.create({
      model: "gpt-5.1", // the newest OpenAI model is "gpt-4.1" which was released May 13, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: createSystemPrompt(availableSurveys),
        },
        {
          role: "user",
          content: `Create a home screen layout for: ${userPrompt}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const jsonResponse = response.choices[0].message.content;
    if (!jsonResponse) {
      throw new Error("No response from OpenAI");
    }

    // Parse and validate the response
    const parsedResponse = JSON.parse(jsonResponse);

    // Extract config and explanation from response
    const parsedConfig = parsedResponse.config || parsedResponse;
    const explanation = parsedResponse.explanation || null;

    // Ensure components array exists
    if (!parsedConfig.components || !Array.isArray(parsedConfig.components)) {
      parsedConfig.components = [];
    }

    // Add some basic validation and cleanup before schema validation
    if (parsedConfig.components) {
      parsedConfig.components.forEach((component: any, index: number) => {
        // Ensure required component fields exist
        if (!component.id) {
          component.id = `${component.type || 'component'}_${Date.now()}_${index}`;
        }
        if (typeof component.order !== 'number') {
          component.order = index + 1;
        }
        if (typeof component.visible !== 'boolean') {
          component.visible = true;
        }

        // Ensure props object exists
        if (!component.props) {
          component.props = {};
        }

        if (component.type === 'header') {
          component.props = {
            title: component.props?.title || component.title || 'Welcome',
            subtitle: component.props?.subtitle || component.subtitle || 'How can I help you today?',
            topics: [],
          };
        }

        if (component.type === 'category_tabs') {
          component.props = {
            topics: [],
            categories: component.props?.categories || component.categories || []
          };
        }


        if (component.props?.actions) {
          component.props.actions.forEach((action: any) => {
            // Ensure description exists for actions
            if (!action.description) {
              action.description =
                action.title || "Click to perform this action";
            }
            // Convert surveyId from string to number if present
            if (action.surveyId && typeof action.surveyId === "string") {
              const numericId = parseInt(action.surveyId, 10);
              if (!isNaN(numericId)) {
                action.surveyId = numericId;
              } else {
                delete action.surveyId; // Remove invalid surveyId
              }
            }
          });
        }
        if (component.props?.topics) {
          component.props.topics.forEach((topic: any) => {
            // Ensure required fields exist for topics
            if (!topic.description) {
              topic.description = topic.title || "Click for more information";
            }
            if (!topic.icon) {
              topic.icon = "HelpCircle";
            }
            if (!topic.category) {
              topic.category = "general";
            }
            // Convert surveyId from string to number if present
            if (topic.surveyId && typeof topic.surveyId === "string") {
              const numericId = parseInt(topic.surveyId, 10);
              if (!isNaN(numericId)) {
                topic.surveyId = numericId;
              } else {
                delete topic.surveyId; // Remove invalid surveyId
              }
            }
          });
        }
      });
    }

    const validatedConfig = HomeScreenConfigSchema.parse(parsedConfig);

    // Return both config and explanation
    return {
      config: validatedConfig,
      explanation: explanation
    } as any;
  } catch (error) {
    console.error("Error generating home screen config:", error);
    if (error instanceof Error && error.message.includes("ZodError")) {
      throw new Error(
        `Schema validation failed. Please ensure all required fields are included in the response.`,
      );
    }
    throw new Error(
      `Failed to generate UI layout: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function modifyHomeScreenConfig(
  currentConfig: HomeScreenConfig,
  modificationPrompt: string,
  chatbotId?: number,
): Promise<{ config: HomeScreenConfig; explanation: string | null }> {
  try {
    // Fetch available surveys if chatbotId is provided
    let availableSurveys: any[] = [];
    if (chatbotId) {
      const { db } = await import("./db");
      const { surveys } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");

      const surveyResults = await db
        .select()
        .from(surveys)
        .where(
          and(
            eq(surveys.chatbotConfigId, chatbotId),
            eq(surveys.status, "active"),
          ),
        );

      availableSurveys = surveyResults.map((survey) => ({
        id: survey.id,
        name: survey.name,
        title: (survey.surveyConfig as any)?.title || survey.name,
        description: survey.description,
      }));
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5.1", // the newest OpenAI model is "gpt-4.1" which was released May 13, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `${createSystemPrompt(availableSurveys)}

You are modifying an existing home screen configuration. 

CRITICAL: Always preserve the existing theme configuration (colors) unless specifically asked to change them. The theme object contains:
- primaryColor
- backgroundColor  
- textColor
- Any other theme properties

Keep the existing structure and theme unless specifically requested to modify them.`,
        },
        {
          role: "user",
          content: `Current config: ${JSON.stringify(currentConfig, null, 2)}

Modification request: ${modificationPrompt}

Return the updated complete configuration as a JSON object with 'config' and 'explanation' keys. The 'config' key should contain the UI JSON, and the 'explanation' key should contain a natural language description of the changes made.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const jsonResponse = response.choices[0].message.content;
    if (!jsonResponse) {
      throw new Error("No response from OpenAI");
    }

    // Parse and validate the response
    const parsedResponse = JSON.parse(jsonResponse);

    // Extract config and explanation from response
    const parsedConfig = parsedResponse.config || parsedResponse;
    const explanation = parsedResponse.explanation || null;

    // Ensure components array exists
    if (!parsedConfig.components || !Array.isArray(parsedConfig.components)) {
      parsedConfig.components = [];
    }

    // Add the same cleanup logic as in generateHomeScreenConfig
    if (parsedConfig.components) {
      parsedConfig.components.forEach((component: any, index: number) => {
        // Ensure required component fields exist
        if (!component.id) {
          component.id = `${component.type || 'component'}_${Date.now()}_${index}`;
        }
        if (typeof component.order !== 'number') {
          component.order = index + 1;
        }
        if (typeof component.visible !== 'boolean') {
          component.visible = true;
        }

        // Ensure props object exists
        if (!component.props) {
          component.props = {};
        }

        if (component.type === 'header') {
          component.props = {
            title: component.props?.title || component.title || 'Welcome',
            subtitle: component.props?.subtitle || component.subtitle || 'How can I help you today?',
            topics: [],
          };
        }

        if (component.type === 'category_tabs') {
          component.props = {
            topics: [],
            categories: component.props?.categories || component.categories || []
          };
        }

        if (component.props?.actions) {
          component.props.actions.forEach((action: any) => {
            if (!action.description) {
              action.description =
                action.title || "Click to perform this action";
            }
            // Convert surveyId from string to number if present
            if (action.surveyId && typeof action.surveyId === "string") {
              const numericId = parseInt(action.surveyId, 10);
              if (!isNaN(numericId)) {
                action.surveyId = numericId;
              } else {
                delete action.surveyId; // Remove invalid surveyId
              }
            }
          });
        }
        if (component.props?.topics) {
          component.props.topics.forEach((topic: any) => {
            if (!topic.description) {
              topic.description = topic.title || "Click for more information";
            }
            if (!topic.icon) {
              topic.icon = "HelpCircle";
            }
            if (!topic.category) {
              topic.category = "general";
            }
            // Convert surveyId from string to number if present
            if (topic.surveyId && typeof topic.surveyId === "string") {
              const numericId = parseInt(topic.surveyId, 10);
              if (!isNaN(numericId)) {
                topic.surveyId = numericId;
              } else {
                delete topic.surveyId; // Remove invalid surveyId
              }
            }
          });
        }
      });
    }

    // CRITICAL: Preserve existing theme if AI didn't include it or if it's missing
    if (currentConfig.theme && (!parsedConfig.theme || Object.keys(parsedConfig.theme).length === 0)) {
      parsedConfig.theme = currentConfig.theme;
    } else if (currentConfig.theme && parsedConfig.theme) {
      // Preserve existing theme properties that weren't explicitly modified
      parsedConfig.theme = {
        ...currentConfig.theme,
        ...parsedConfig.theme
      };
    }

    const validatedConfig = HomeScreenConfigSchema.parse(parsedConfig);

    // Return both config and explanation
    return {
      config: validatedConfig,
      explanation: explanation
    } as any;
  } catch (error) {
    console.error("Error modifying home screen config:", error);
    if (error instanceof Error && error.message.includes("ZodError")) {
      throw new Error(
        `Schema validation failed. Please ensure all required fields are included in the response.`,
      );
    }
    throw new Error(
      `Failed to modify UI layout: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Default home screen configuration
export function getDefaultHomeScreenConfig(): HomeScreenConfig {
  return {
    version: "1.0",
    components: [
      {
        id: "header_default",
        type: "header",
        props: {
          title: "Welcome to BotTailor",
          subtitle: "How can we help you today?",
          topics: [],
        },
        order: 1,
        visible: true,
      },
      {
        id: "categories_default",
        type: "category_tabs",
        props: {
          topics: [],
          categories: ["support", "sales", "billing"],
        },
        order: 2,
        visible: true,
      },
      {
        id: "topics_default",
        type: "topic_grid",
        props: {
          topics: [
            {
              id: "product_info",
              title: "Product Information",
              description: "Learn about our products and features",
              icon: "MessageCircle",
              actionType: "message",
              message:
                "Hi! I would like to learn more about your products and features.",
              category: "sales",
              popular: true,
            },
            {
              id: "billing_help",
              title: "Billing Support",
              description: "Questions about billing and payments",
              icon: "CreditCard",
              actionType: "message",
              message: "I have questions about my billing and payment options.",
              category: "billing",
            },
            {
              id: "technical_support",
              title: "Technical Support",
              description: "Troubleshoot technical issues",
              icon: "Shield",
              actionType: "message",
              message: "I am experiencing technical issues and need support.",
              category: "support",
            },
            {
              id: "contact_agent",
              title: "Talk to Human Agent",
              description: "Connect with a human representative",
              icon: "Phone",
              actionType: "message",
              message: "I would like to speak with a human agent please.",
              category: "support",
            },
          ],
          style: {
            itemStyle: 'filled',
            layout: 'grid',
            columns: 2
          },
        },
        order: 3,
        visible: true,
      },
    ],
    theme: {
      primaryColor: "#3b82f6",
      backgroundColor: "#ffffff",
      textColor: "#1f2937",
    },
    settings: {
      enableSearch: false,
      enableCategories: true,
      defaultCategory: "all",
    },
  };
}