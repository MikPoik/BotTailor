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

// Define individual message bubble schema
const MessageBubbleSchema = z.object({
  messageType: z.enum(['text', 'card', 'menu', 'image', 'quickReplies', 'form', 'system']),
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

// Function to build system prompt with chatbot config and survey context
export function buildSystemPrompt(chatbotConfig?: any, surveyContext?: string): string {
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


**For Surveys (step-by-step questionnaires):**
{
  "bubbles": [
    {"messageType": "text", "content": "Let me help you with a quick assessment."},
    {"messageType": "text", "content": "Question 1: How would you describe your current situation?"},
    {"messageType": "menu", "content": "", "metadata": {
      "options": [
        {"id": "option1", "text": "First option", "action": "select"},
        {"id": "option2", "text": "Second option", "action": "select"},
        {"id": "option3", "text": "Third option", "action": "select"},
        {"id": "option4", "text": "Fourth option", "action": "select"}
      ]
    }}
  ]
}

**CRITICAL: Survey Consistency Rules:**
- EVERY survey question MUST end with a menu of options
- NEVER present a question without providing answer choices
- If you see previous menu history like "[MENU] Presented options: option1, option2, option3", continue the same pattern
- Survey questions should ALWAYS follow this format: Question text + Menu with options
- Never break survey flow by omitting menu options

**Guidelines:**
- **Descriptive content**: Use 1-2 substantial bubbles (150-300 words each) that fully explain concepts, services, or detailed information
- **Interactive content**: Use 2-4 shorter bubbles for greetings, questions, and options
- **Survey questions**: Present ONE question at a time with a menu of options. Wait for user response before proceeding to next question
- **Each bubble should be self-contained** - don't split related information across bubbles unnecessarily  
- **End with engagement** - final bubble should invite further interaction or questions
- **Prioritize readability** - longer explanations are better in single bubbles than fragmented across multiple short ones
- **Menu options must be complete**: Every option object MUST have "id", "text", and "action" properties
- **Valid JSON only**: Ensure the entire response is valid JSON with no extra text or comments. Never send incomplete JSON objects.

**CRITICAL: Response Format Requirements:**
- ALWAYS wrap your response in a "bubbles" array
- NEVER send a single message object directly  
- Even for simple single responses, use: {"bubbles": [{"messageType": "text", "content": "your message"}]}
- Invalid format: {"messageType": "text", "content": "message"}
- Correct format: {"bubbles": [{"messageType": "text", "content": "message"}]}
`;

  // Add survey context if provided
  const surveyInstructions = surveyContext || "";

  const surveyInfo = "";

## Survey Integration:
When creating survey launchers, use:
- actionType: "survey"
- surveyId: valid survey ID from available surveys (REQUIRED - use exact ID numbers)
- action: "take_assessment" or "start_survey"  
- Appropriate icons: "Star", "BarChart", "PieChart", "TrendingUp"
- Clear descriptions indicating it's a survey/assessment

**IMPORTANT**: Always match survey titles/names mentioned in prompts to available survey IDs. For example:
- If user asks for "Valitse sopiva terapia muoto" survey, find the matching survey by name/title and use its ID
- If user mentions a specific survey, search available surveys for name/title matches
- If no specific survey mentioned, use the first available survey${surveyInfo}

  return `${customPrompt}\n\n${structureInstructions}\n\n${surveyInstructions}`;
}

// Function to build survey context for AI when a survey is active
export function buildSurveyContext(survey: any, surveySession: any): string {
  const config = survey.surveyConfig;
  const currentQuestionIndex = surveySession.currentQuestionIndex || 0;
  const responses = surveySession.responses || {};

  if (!config.questions || config.questions.length === 0) {
    return "";
  }

  // If survey is completed
  if (currentQuestionIndex >= config.questions.length) {
    return `
**SURVEY COMPLETED**
Survey "${config.title}" has been completed. 
Completion message: "${config.completionMessage || 'Thank you for completing the survey!'}"
Previous responses: ${JSON.stringify(responses)}
Do not ask any more survey questions.
`;
  }

  const currentQuestion = config.questions[currentQuestionIndex];
  const nextQuestionIndex = currentQuestionIndex + 1;

  let context = `
**ACTIVE SURVEY CONTEXT**
Survey: "${config.title}"
${config.description ? `Description: ${config.description}` : ''}
Progress: Question ${currentQuestionIndex + 1} of ${config.questions.length}
${config.aiInstructions ? `AI Instructions: ${config.aiInstructions}` : ''}

**CURRENT QUESTION**
Question ${currentQuestionIndex + 1}: ${currentQuestion.text}
Type: ${currentQuestion.type}
Required: ${currentQuestion.required ? 'Yes' : 'No'}
`;

  if (currentQuestion.options && currentQuestion.options.length > 0) {
    context += `
**OPTIONS (MUST PRESENT AS MENU)**
`;
    currentQuestion.options.forEach((option: any, index: number) => {
      context += `${index + 1}. ${option.text}\n`;
    });
    context += `
**CRITICAL**: You MUST present this question with a menu containing these exact options.
`;
  }

  if (Object.keys(responses).length > 0) {
    context += `
**PREVIOUS RESPONSES**
${Object.entries(responses).map(([qId, answer]) => `${qId}: ${answer}`).join('\n')}
`;
  }

  context += `
**SURVEY FLOW INSTRUCTIONS**
1. Present the current question with clear menu options
2. Wait for user response before proceeding
3. Store the response and advance to next question
4. Continue until all questions are answered
5. End with the completion message

**IMPORTANT**: This is question ${currentQuestionIndex + 1} of ${config.questions.length}. After user answers, you will be automatically advanced to the next question.
`;

  return context;
}