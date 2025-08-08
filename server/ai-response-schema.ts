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
  messageType: z.enum(['text', 'card', 'menu', 'image', 'quickReplies', 'form', 'form_submission', 'system']),
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

  // Check if email configuration is properly set up for forms
  const hasEmailConfig = chatbotConfig?.formRecipientEmail && chatbotConfig?.senderEmail;
  console.log(`[SYSTEM_PROMPT] Email config check - formRecipientEmail: ${chatbotConfig?.formRecipientEmail}, senderEmail: ${chatbotConfig?.senderEmail}, hasEmailConfig: ${hasEmailConfig}`);

  // Build message types list conditionally
  const messageTypes = [
    "1. TEXT: Simple text responses with optional quick replies",
    "2. CARD: Rich cards with title, description, image, and action buttons, use only if asked about a product.",
    "3. MENU: Interactive menus with selectable options", 
    "4. IMAGE: Image responses with optional text",
    "5. QUICKREPLIES: Text with suggested quick reply buttons"
  ];
  
  if (hasEmailConfig) {
    messageTypes.push("6. FORM: Interactive forms with input fields and submit button");
  }

  // Technical structure instructions for message formatting
  const structureInstructions = `

You respond with multiple message bubbles in a single turn to create natural, human-like conversations.

Message Types Available:
${messageTypes.join('\n')}

**CRITICAL SURVEY RULES (HIGHEST PRIORITY):**
- When presenting survey questions with multiple choice options, you MUST use messageType "menu"
- Survey menus are REQUIRED, not optional - never use "text" messageType for questions with options
- Each menu option MUST include: id, text, and action fields
- ALWAYS present question text in a separate text bubble before the menu bubble
- For user responses, provide brief acknowledgment before advancing to next question
- Survey questions without menu options will be considered broken and must be fixed

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

**For Survey Questions:**
ALWAYS use text bubble + menu bubble pattern:
{
  "bubbles": [
    {"messageType": "text", "content": "Question 1: How would you describe your current situation?"},
    {"messageType": "menu", "content": "Please select the option that best describes your situation:", "metadata": {"options": [
      {"id": "option1", "text": "I need help with daily activities", "action": "select"},
      {"id": "option2", "text": "I'm looking for relationship support", "action": "select"}
    ]}}
  ]
}

**For Survey Response Acknowledgments:**
{
  "bubbles": [
    {"messageType": "text", "content": "Thank you for your response. Let's continue with the next question."},
    {"messageType": "text", "content": "Question 2: How urgent do you consider your situation?"},
    {"messageType": "menu", "content": "Please select:", "metadata": {"options": [...]}}
  ]
}

Example for regular greetings and options:
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

${hasEmailConfig ? 
`**For Contact Forms:**
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
}` : 
`**For Contact Requests:**
When users ask to contact you or leave their information, explain that contact forms are not currently available and suggest alternative ways to get in touch (website, phone, email, etc.) based on the context provided.`}


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
- Remember to end survey when it is completed.

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
    // Build complete Q&A context for completed surveys
    const qaContext = config.questions.map((question: any, index: number) => {
      // Try indexed ID first (question_0, question_1, etc.), then fallback to question.id
      const indexedId = `question_${index}`;
      const response = responses[indexedId] || responses[question.id] || 'No response';
      return `Q${index + 1}: ${question.text}\nA${index + 1}: ${response}`;
    }).join('\n\n');

    return `
**SURVEY COMPLETED**
Survey: "${survey.name}" (${config.title})
${survey.description ? `Description: ${survey.description}` : ''}
${config.description ? `Survey Details: ${config.description}` : ''}
Completion message: "${config.completionMessage || 'Thank you for completing the survey!'}"
${config.aiInstructions ? `AI Instructions: ${config.aiInstructions}` : ''}

**COMPLETE SURVEY RESPONSES**
${qaContext}

Do not ask any more survey questions.
Offer a contact form or a link to contact us instead.
`;
  }

  const currentQuestion = config.questions[currentQuestionIndex];
  const nextQuestionIndex = currentQuestionIndex + 1;

  let context = `
**ACTIVE SURVEY CONTEXT**
Survey: "${survey.name}" (${config.title})
${survey.description ? `Description: ${survey.description}` : ''}
${config.description ? `Survey Details: ${config.description}` : ''}
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
**CRITICAL SURVEY REQUIREMENT**: 
- You MUST use messageType "menu" for this question
- You MUST include metadata.options array with these exact options
- Each option MUST have: id, text, and action fields
- DO NOT use text messageType for survey questions with options
- Example format:
{
  "messageType": "menu",
  "content": "Question text here",
  "metadata": {
    "options": [
      {"id": "option1", "text": "Option 1 text", "action": "select"},
      {"id": "option2", "text": "Option 2 text", "action": "select"}
    ]
  }
}
`;
  }

  if (Object.keys(responses).length > 0) {
    context += `
**PREVIOUS RESPONSES**
`;
    // Build Q&A pairs for previous responses
    Object.entries(responses).forEach(([qId, answer]) => {
      // Handle indexed question IDs (question_0, question_1, etc.)
      const indexMatch = qId.match(/^question_(\d+)$/);
      if (indexMatch) {
        const questionIndex = parseInt(indexMatch[1], 10);
        const question = config.questions[questionIndex];
        if (question) {
          context += `Q${questionIndex + 1}: ${question.text}\nA${questionIndex + 1}: ${answer}\n\n`;
        } else {
          context += `${qId}: ${answer}\n`;
        }
      } else {
        // Fallback: try to find question by ID
        const question = config.questions.find((q: any) => q.id === qId);
        if (question) {
          const questionIndex = config.questions.findIndex((q: any) => q.id === qId);
          context += `Q${questionIndex + 1}: ${question.text}\nA${questionIndex + 1}: ${answer}\n\n`;
        } else {
          context += `${qId}: ${answer}\n`;
        }
      }
    });
  }

  context += `
**SURVEY FLOW INSTRUCTIONS**
1. ALWAYS provide a text bubble with the question before the menu
2. Present question number and text clearly (e.g., "Question 2: [question text]")  
3. THEN follow with a menu bubble containing the exact options
4. For user responses: Give brief acknowledgment before next question
5. Continue until all questions are answered

**CRITICAL SURVEY RULES:**
- Use TWO bubbles per question: TEXT bubble + MENU bubble
- Text bubble: Question number and text for context
- Menu bubble: Interactive options for selection
- NEVER present only menu without question context
- Example proper format:
[
  {"messageType": "text", "content": "Question ${currentQuestionIndex + 1}: ${currentQuestion.text}"},
  {"messageType": "menu", "content": "Please select your answer:", "metadata": {"options": [...]}}
]

**IMPORTANT**: This is question ${currentQuestionIndex + 1} of ${config.questions.length}. Present BOTH question text AND menu options.
`;

  return context;
}