import OpenAI from "openai";
import { z } from "zod";
import { HomeScreenConfigSchema, type HomeScreenConfig } from "@shared/schema";

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// UI Designer system prompt
const UI_DESIGNER_SYSTEM_PROMPT = `You are an expert UI/UX designer for chat widget home screens. You create beautiful, functional layouts based on user requirements.

COMPONENT TYPES AVAILABLE:
1. header - Title and subtitle sections
2. category_tabs - Filter tabs for topics 
3. topic_grid - Grid of clickable topic cards
4. quick_actions - Action buttons for common tasks
5. footer - Footer content

RESPONSE FORMAT: Return valid JSON matching the HomeScreenConfig schema.

DESIGN PRINCIPLES:
- Mobile-first responsive design
- Clear visual hierarchy
- Intuitive user experience
- Accessibility considerations
- Brand consistency

CRITICAL: ALL FIELDS MARKED AS REQUIRED MUST BE INCLUDED:
- actions[].description is REQUIRED (cannot be undefined or null)
- topics[].description is REQUIRED
- topics[].icon is REQUIRED
- topics[].category is REQUIRED

EXAMPLE CONFIG:
{
  "version": "1.0",
  "components": [
    {
      "id": "header_1",
      "type": "header",
      "props": {
        "title": "Welcome to Support",
        "subtitle": "How can we help you today?"
      },
      "order": 1,
      "visible": true
    },
    {
      "id": "quick_actions_1",
      "type": "quick_actions",
      "props": {
        "actions": [
          {
            "id": "start_chat",
            "title": "Start Free Chat",
            "description": "Ask anything you want",
            "action": "start_chat"
          },
          {
            "id": "live_agent",
            "title": "Request Live Agent",
            "description": "Talk to a human representative",
            "action": "request_agent"
          }
        ]
      },
      "order": 2,
      "visible": true
    },
    {
      "id": "topics_1", 
      "type": "topic_grid",
      "props": {
        "topics": [
          {
            "id": "billing",
            "title": "Billing Help",
            "description": "Payment and subscription questions",
            "icon": "CreditCard",
            "message": "I need help with billing",
            "category": "billing",
            "popular": true
          }
        ],
        "style": {
          "layout": "grid",
          "columns": 2
        }
      },
      "order": 3,
      "visible": true
    }
  ],
  "theme": {
    "primaryColor": "#3b82f6",
    "backgroundColor": "#ffffff",
    "textColor": "#1f2937"
  }
}

AVAILABLE ICONS:
MessageCircle, ShoppingCart, CreditCard, Truck, RotateCcw, HelpCircle, Star, Gift, Shield, Phone, Search, Grid, List, Home

Always respond with valid JSON that can be parsed and rendered immediately.`;

export async function generateHomeScreenConfig(userPrompt: string): Promise<HomeScreenConfig> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: UI_DESIGNER_SYSTEM_PROMPT,
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
    const parsedConfig = JSON.parse(jsonResponse);
    
    // Add some basic validation and cleanup before schema validation
    if (parsedConfig.components) {
      parsedConfig.components.forEach((component: any) => {
        if (component.props?.actions) {
          component.props.actions.forEach((action: any) => {
            // Ensure description exists for actions
            if (!action.description) {
              action.description = action.title || "Click to perform this action";
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
          });
        }
      });
    }
    
    const validatedConfig = HomeScreenConfigSchema.parse(parsedConfig);
    
    return validatedConfig;
  } catch (error) {
    console.error("Error generating home screen config:", error);
    if (error instanceof Error && error.message.includes('ZodError')) {
      throw new Error(`Schema validation failed. Please ensure all required fields are included in the response.`);
    }
    throw new Error(`Failed to generate UI layout: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function modifyHomeScreenConfig(
  currentConfig: HomeScreenConfig,
  modificationPrompt: string
): Promise<HomeScreenConfig> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `${UI_DESIGNER_SYSTEM_PROMPT}

You are modifying an existing home screen configuration. Keep the existing structure unless specifically asked to change it.`,
        },
        {
          role: "user",
          content: `Current config: ${JSON.stringify(currentConfig, null, 2)}

Modification request: ${modificationPrompt}

Return the updated complete configuration.`,
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
    const parsedConfig = JSON.parse(jsonResponse);
    
    // Add the same cleanup logic as in generateHomeScreenConfig
    if (parsedConfig.components) {
      parsedConfig.components.forEach((component: any) => {
        if (component.props?.actions) {
          component.props.actions.forEach((action: any) => {
            if (!action.description) {
              action.description = action.title || "Click to perform this action";
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
          });
        }
      });
    }
    
    const validatedConfig = HomeScreenConfigSchema.parse(parsedConfig);
    
    return validatedConfig;
  } catch (error) {
    console.error("Error modifying home screen config:", error);
    if (error instanceof Error && error.message.includes('ZodError')) {
      throw new Error(`Schema validation failed. Please ensure all required fields are included in the response.`);
    }
    throw new Error(`Failed to modify UI layout: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          title: "Welcome to Support",
          subtitle: "How can we help you today?",
        },
        order: 1,
        visible: true,
      },
      {
        id: "categories_default",
        type: "category_tabs",
        props: {
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
              message: "Hi! I would like to learn more about your products and features.",
              category: "sales",
              popular: true,
            },
            {
              id: "billing_help",
              title: "Billing Support",
              description: "Questions about billing and payments",
              icon: "CreditCard",
              message: "I have questions about my billing and payment options.",
              category: "billing",
            },
            {
              id: "technical_support",
              title: "Technical Support",
              description: "Troubleshoot technical issues",
              icon: "Shield",
              message: "I am experiencing technical issues and need support.",
              category: "support",
            },
            {
              id: "contact_agent",
              title: "Talk to Human Agent",
              description: "Connect with a human representative",
              icon: "Phone",
              message: "I would like to speak with a human agent please.",
              category: "support",
            },
          ],
          style: {
            layout: "grid",
            columns: 2,
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