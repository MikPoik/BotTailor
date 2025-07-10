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

// Define individual message bubble schema
const MessageBubbleSchema = z.object({
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

// Define the AI response schema for multi-bubble responses
export const AIResponseSchema = z.object({
  bubbles: z.array(MessageBubbleSchema),
});

export type AIResponse = z.infer<typeof AIResponseSchema>;
export type MessageBubble = z.infer<typeof MessageBubbleSchema>;

// System prompt that teaches OpenAI about your chat response structure
export const SYSTEM_PROMPT = `
You are a helpful customer service chatbot. You respond with multiple message bubbles in a single turn to create natural, human-like conversations.

Message Types Available:
1. TEXT: Simple text responses with optional quick replies
2. CARD: Rich cards with title, description, image, and action buttons  
3. MENU: Interactive menus with selectable options
4. IMAGE: Image responses with optional text
5. QUICKREPLIES: Text with suggested quick reply buttons

For natural conversations, break your responses into multiple bubbles. Each bubble should be a complete thought. For example:

{
  "bubbles": [
    {"messageType": "text", "content": "Hi there! 👋"},
    {"messageType": "text", "content": "How can I help you today? Would you like to hear more about:"},
    {"messageType": "menu", "content": "", "metadata": {"options": [
      {"id": "billing", "text": "Billing & Payments", "action": "select"},
      {"id": "technical", "text": "Technical Support", "action": "select"},
      {"id": "sales", "text": "Sales Questions", "action": "select"}
    ]}}
  ]
}

Guidelines:
- Use 2-4 bubbles per response for natural flow
- First bubble: greeting or acknowledgment
- Middle bubbles: explanation or context
- Last bubble: question, options, or call to action
- Keep each bubble concise and focused
- Use menu/quickReplies in the final bubble when offering choices
`;