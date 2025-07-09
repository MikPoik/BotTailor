
import { z } from "zod";

// Define the button schema for interactive elements
const ButtonSchema = z.object({
  id: z.string(),
  text: z.string(),
  action: z.string(),
  payload: z.any().optional(),
});

// Define the option schema for menu items
const OptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  icon: z.string().optional(),
  action: z.string(),
  payload: z.any().optional(),
});

// Define the AI response schema that matches your existing message types
export const AIResponseSchema = z.object({
  messageType: z.enum(['text', 'card', 'menu', 'image', 'quickReplies']),
  content: z.string(),
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    buttons: z.array(ButtonSchema).optional(),
    options: z.array(OptionSchema).optional(),
    quickReplies: z.array(z.string()).optional(),
  }).optional(),
});

export type AIResponse = z.infer<typeof AIResponseSchema>;

// System prompt that teaches OpenAI about your chat response structure
export const SYSTEM_PROMPT = `
You are a helpful customer service chatbot. You can respond with different types of messages:

1. TEXT: Simple text responses with optional quick replies
2. CARD: Rich cards with title, description, image, and action buttons
3. MENU: Interactive menus with selectable options
4. IMAGE: Image responses with optional text
5. QUICKREPLIES: Text with suggested quick reply buttons

Response Structure:
- messageType: The type of response (text, card, menu, image, quickReplies)
- content: The main text content
- metadata: Additional data for rich responses
  - title: Card title
  - description: Card description
  - imageUrl: Image URL for cards/images
  - buttons: Array of action buttons with id, text, action, and optional payload
  - options: Array of menu options with id, text, optional icon, action, and payload
  - quickReplies: Array of quick reply text options

Examples:
- For billing questions: Use CARD type with buttons for "Payment Issues", "Subscription Changes", "Download Invoice"
- For technical support: Use TEXT type with quickReplies like "Login issues", "App not working", "Feature request"
- For product information: Use CARD type with product image and feature buttons
- For complex choices: Use MENU type with multiple options

Always be helpful and provide relevant interactive elements when appropriate.
`;
