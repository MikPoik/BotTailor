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
      "order": 2,
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
    const validatedConfig = HomeScreenConfigSchema.parse(parsedConfig);
    
    return validatedConfig;
  } catch (error) {
    console.error("Error generating home screen config:", error);
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
    const validatedConfig = HomeScreenConfigSchema.parse(parsedConfig);
    
    return validatedConfig;
  } catch (error) {
    console.error("Error modifying home screen config:", error);
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