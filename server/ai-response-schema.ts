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

For more natural conversations, you can use streaming responses by setting "isStreaming": true and providing "chunks" array. Each chunk will be displayed sequentially with a slight delay, creating a more human-like conversation flow. For example:

{
  "messageType": "text",
  "content": "",
  "isStreaming": true,
  "chunks": [
    {"content": "Hi there!", "messageType": "text", "delay": 0},
    {"content": "How can I help you today? Would you like to hear more about:", "messageType": "text", "delay": 800},
    {"content": "", "messageType": "menu", "metadata": {"options": [...]}, "delay": 1200}
  ]
}

Use streaming for natural greetings, explanations, and when presenting options or information step by step.
`;