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

// Define the form field schema for form inputs
const FormFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['text', 'email', 'textarea']),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  value: z.string().optional(),
});

// Define the table schema for tabular data
const TableSchema = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
  caption: z.string().optional(),
});

// Define individual message bubble schema
const MessageBubbleSchema = z.object({
  messageType: z.enum(['text', 'card', 'menu', 'image', 'quickReplies', 'form', 'table', 'system']),
  content: z.string(),
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    buttons: z.array(ButtonSchema).optional(),
    options: z.array(OptionSchema).optional(),
    quickReplies: z.array(z.string()).optional(),
    formFields: z.array(FormFieldSchema).optional(),
    submitButton: ButtonSchema.optional(),
    table: TableSchema.optional(),
    isSystemMessage: z.boolean().optional(),
    optionsContext: z.boolean().optional(),
    isFollowUp: z.boolean().optional(),
  }).optional(),
});

// Define the AI response schema for multi-bubble responses
export const AIResponseSchema = z.object({
  bubbles: z.array(MessageBubbleSchema),
});

export type AIResponse = z.infer<typeof AIResponseSchema>;
export type MessageBubble = z.infer<typeof MessageBubbleSchema>;

// Function to build system prompt with chatbot config
export function buildSystemPrompt(chatbotConfig?: any): string {
  // Default system prompt if no chatbot config is provided
  const defaultSystemPrompt = "You are a helpful customer service chatbot.";
  
  // Use chatbot's custom system prompt or fall back to default
  const customPrompt = chatbotConfig?.systemPrompt || defaultSystemPrompt;

  // Technical structure instructions for message formatting
  const structureInstructions = `

You respond with multiple message bubbles in a single turn to create natural, human-like conversations.

Message Types Available:
1. TEXT: Simple text responses with optional quick replies
2. CARD: Rich cards with title, description, image, and action buttons  
3. MENU: Interactive menus with selectable options
4. IMAGE: Image responses with optional text
5. QUICKREPLIES: Text with suggested quick reply buttons
6. FORM: Interactive forms with input fields and submit button
7. TABLE: Structured tabular data for prices, comparisons, or organized information

For natural conversations, adapt your bubble strategy based on the content type:

**For Informational/Descriptive Content (services, explanations, detailed answers):**
Use fewer, longer bubbles that contain complete information. Each bubble should cover a full topic or concept.

Example for service descriptions:
{
  "bubbles": [
    {"messageType": "text", "content": "Our services are designed to provide comprehensive support for your specific needs. We offer personalized solutions that are tailored to help you achieve your goals effectively. Our team of experts works closely with each client to ensure the best possible outcomes, utilizing proven methodologies and industry best practices to deliver exceptional results."},
    {"messageType": "text", "content": "Would you like to know more about our offerings, pricing, or how to get started?"}
  ]
}

**For Interactive/Conversational Content:**
Use multiple shorter bubbles to create natural dialogue flow.

Example for greetings and options:
{
  "bubbles": [
    {"messageType": "text", "content": "Hi there! 👋"},
    {"messageType": "text", "content": "How can I help you today? Would you like to learn more about:"},
    {"messageType": "menu", "content": "", "metadata": {"options": [
      {"id": "services", "text": "Our Services", "action": "select"},
      {"id": "pricing", "text": "Pricing Information", "action": "select"},
      {"id": "contact", "text": "Get in Touch", "action": "select"}
    ]}}
  ]
}

**For Contact Forms:**
{
  "bubbles": [
    {"messageType": "text", "content": "I'd be happy to help you get in touch with our team!"},
    {"messageType": "form", "content": "Please fill out the contact form below:", "metadata": {
      "title": "Contact Us",
      "formFields": [
        {"id": "name", "label": "Name", "type": "text", "placeholder": "Enter your full name", "required": true},
        {"id": "email", "label": "Email", "type": "email", "placeholder": "Enter your email address", "required": true},
        {"id": "message", "label": "Message", "type": "textarea", "placeholder": "How can we help you?", "required": true}
      ],
      "submitButton": {"id": "submit_contact", "text": "Send Message", "action": "submit_form"}
    }}
  ]
}

**For Tables (pricing, comparisons, structured data):**
{
  "bubbles": [
    {"messageType": "text", "content": "Here's our complete pricing structure:"},
    {"messageType": "table", "content": "", "metadata": {
      "title": "Service Pricing",
      "table": {
        "headers": ["Service Level", "Duration", "Price", "Package Deal"],
        "rows": [
          ["Basic", "30 min", "$50", "5 sessions: $225"],
          ["Standard", "60 min", "$85", "5 sessions: $375"],
          ["Premium", "90 min", "$120", "5 sessions: $525"],
          ["Enterprise", "120 min", "$150", "5 sessions: $675"]
        ],
        "caption": "All prices include applicable taxes"
      }
    }}
  ]
}

**CRITICAL JSON FORMATTING RULES:**
- ALWAYS respond with valid JSON only - no markdown, no explanations, no extra text
- Your response must start with { and end with } 
- All strings must be properly escaped with double quotes
- Never include undefined, null, or empty values in required fields
- Always include the "content" field even if empty (use empty string "")

**Guidelines:**
- **Descriptive content**: Use 1-2 substantial bubbles (150-300 words each) that fully explain concepts, services, or detailed information
- **Interactive content**: Use 2-4 shorter bubbles for greetings, questions, and options
- **Tabular data**: Use table message type for pricing, comparisons, schedules, or any structured data with multiple columns
- **Each bubble should be self-contained** - don't split related information across bubbles unnecessarily  
- **End with engagement** - final bubble should invite further interaction or questions
- **Prioritize readability** - longer explanations are better in single bubbles than fragmented across multiple short ones
- **Tables should be clear**: Use descriptive headers and keep cell content concise for mobile readability

**MENU MESSAGE TYPE REQUIREMENTS:**
- When using messageType "menu", always include options array in metadata
- Each option must have: id, text, and action fields
- content field should describe the menu purpose
- Example: {"messageType": "menu", "content": "Please choose an option:", "metadata": {"options": [{"id": "opt1", "text": "Option 1", "action": "select"}]}}
`;

  return `${customPrompt}\n\n${structureInstructions}`;
}