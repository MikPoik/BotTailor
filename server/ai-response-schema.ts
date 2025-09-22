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
  type: z.enum(["text", "email", "textarea"]),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  value: z.string().optional(),
});

// Define individual message bubble schema
const MessageBubbleSchema = z.object({
  messageType: z.enum([
    "text",
    "card",
    "menu",
    "multiselect_menu",
    "rating",
    "image",
    "quickReplies",
    "form",
    "form_submission",
    "system",
  ]),
  content: z.string(),
  metadata: z
    .object({
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
      // Rating specific metadata
      minValue: z.number().optional(),
      maxValue: z.number().optional(),
      step: z.number().optional(),
      ratingType: z.enum(["stars", "numbers", "scale"]).optional(),
      // Multiselect specific metadata
      allowMultiple: z.boolean().optional(),
      minSelections: z.number().optional(),
      maxSelections: z.number().optional(),
      // Survey specific metadata
      surveyConfig: z.any().optional(),
    })
    .optional(),
});

// Define the AI response schema for multi-bubble responses
export const AIResponseSchema = z.object({
  bubbles: z.array(MessageBubbleSchema),
});

export type AIResponse = z.infer<typeof AIResponseSchema>;
export type MessageBubble = z.infer<typeof MessageBubbleSchema>;

// Function to build system prompt with chatbot config and survey context
export function buildSystemPrompt(
  chatbotConfig?: any,
  surveyContext?: string,
  isSurveyActive = false,
): string {
  // Default system prompt if no chatbot config is provided
  const defaultSystemPrompt = "You are a helpful customer service chatbot.";

  // Use chatbot's custom system prompt or fall back to default
  const customPrompt = chatbotConfig?.systemPrompt || defaultSystemPrompt;

  // Check if email configuration is properly set up for forms
  const hasEmailConfig = chatbotConfig?.formRecipientEmail;
  console.log(
    `[SYSTEM_PROMPT] Email config check - formRecipientEmail: ${chatbotConfig?.formRecipientEmail}, hasEmailConfig: ${hasEmailConfig}`,
  );

  // Build message types list conditionally based on survey context
  const messageTypes = [
    "1. TEXT: Simple text responses with optional quick replies. You can format text with markdown syntax",
    "2. CARD: Rich cards with title, description, image, and action buttons, use only if asked about a product.",
    "3. MENU: Interactive menus with selectable options (single choice)",
    "4. IMAGE: Image responses with optional text",
    "5. QUICKREPLIES: Text with suggested quick reply buttons",
  ];

  // Add survey-specific message types only when in survey mode
  if (isSurveyActive) {
    messageTypes.push(
      "6. MULTISELECT_MENU: Multi-selection menus for multiple choice questions (allows selecting multiple options)",
      "7. RATING: Rating scale inputs for rating questions (1-5 stars, 1-10 scale, etc.)",
    );
  }

  if (hasEmailConfig) {
    const formIndex = isSurveyActive ? "8" : "6";
    messageTypes.push(
      `${formIndex}. FORM: Interactive forms with input fields and submit button`,
    );
  }

  // Technical structure instructions for message formatting
  const structureInstructions = `

You respond with multiple message bubbles in a single turn to create natural, human-like conversations.

Message Types Available:
${messageTypes.join("\n")}

${isSurveyActive ? `**SURVEY RULES:**
- Always provide conversational context before questions
- For first question: include survey introduction
- For follow-up questions: acknowledge previous response
- Questions with options = text bubble + appropriate menu bubble based on question type:
  * single_choice questions → MENU (single selection)
  * multiple_choice questions → MULTISELECT_MENU (multiple selections) ⚠️ CRITICAL: Use EXACT option texts
  * rating questions → RATING (rating scale)
  * text questions → TEXT (free text input) + optional quickReplies for skip
- 🚨 MULTISELECT_MENU CRITICAL RULE: NEVER use "Option 1", "Option 2" - use the EXACT survey option texts provided
- Use exact option texts provided in survey context
- Do not invent new options or change existing ones
- For optional questions: provide skip option using quickReplies
- Present surveys only if there is active survey context!` : ''}

For natural conversations, adapt your bubble strategy based on the content type:

**For Informational/Descriptive Content (services, explanations, detailed answers):**
Use fewer, longer bubbles that contain complete information. Each bubble should cover a full topic or concept.

Example for service descriptions:
{
  "bubbles": [
    {"messageType": "text", "content": "**Our** services are designed to provide comprehensive support for your specific needs. We offer personalized solutions that are tailored to help you achieve your goals effectively. Our team of experts works closely with each client to ensure the best possible outcomes, utilizing proven methodologies and industry best practices to deliver exceptional results."},
    {"messageType": "text", "content": "Would you like to know more about our **offerings**, **pricing**, or how to get started?"}
  ]
}

${isSurveyActive ? `**Survey Examples:**

First question:
[
  {"messageType": "text", "content": "Let's begin the survey. This will help us understand your needs."},
  {"messageType": "text", "content": "Question 1: How would you describe your current situation?"},
  {"messageType": "menu", "content": "Please select:", "metadata": {"options": [...]}}
]

Follow-up question, aknowledge user's response and validate their feelings. For example :
[
  {"messageType": "text", "content": "Thank you for your response, it is common to feel that way. Let's continue."},
  {"messageType": "text", "content": "Question 2: How urgent is your situation?"},
  {"messageType": "menu", "content": "Please select:", "metadata": {"options": [...]}}
]` : ''}

**For Interactive/Conversational Content:**
Use multiple shorter bubbles to create natural dialogue flow.

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

${
  hasEmailConfig
    ? `**For Contact Forms:**
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
      "submitButton": {"id": "submit_contact", "text": "Send", "icon": "Send", "action": "submit_form"}
    }}
  ]
}`
    : `**For Contact Requests:**
When users ask to contact you or leave their information, explain that contact forms are not currently available and suggest alternative ways to get in touch (website, phone, email, etc.) based on the context provided. Format url links as markdown: [link text](url)`
}


${isSurveyActive ? `**For Surveys (step-by-step questionnaires):**
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
- Remember to end survey when it is completed.` : ''}

**Guidelines:**
- **Language Detection & Localization**: Automatically detect the language from survey questions/user input and respond in the SAME language. Localize all interface elements (skip buttons, acknowledgments, etc.) appropriately.
- **Descriptive content**: Use concise bubbles (50-150 words each) that clearly convey the main idea
- **Interactive content**: Use multiple short bubbles to facilitate natural dialogue, such as greetings, questions, and choices
- **Survey questions**: One question per bubble with an options menu; wait for response before proceeding
- **Each bubble should convey a complete thought** - avoid overly splitting information
- **Engage the user** - end with a call to action or an invitation to ask more questions
- **Prioritize clarity and engagement** - concise, informative bubbles are more effective
- **Complete menu options**: Each option must include "id", "text", and "action"
- **Valid JSON only**: Ensure all responses are valid JSON with no extra text or incomplete objects.

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

  // Strong directive to ignore previous surveys
  let context = `
🔴 CRITICAL: NEW SURVEY SESSION 🔴
IGNORE ALL PREVIOUS SURVEY QUESTIONS, ANSWERS, AND RESULTS IN CHAT HISTORY.
This is a completely independent, fresh survey. Do not reference or continue any previous surveys.
Previous conversations about other surveys are irrelevant to this new survey.

`;

  // If survey is completed
  if (currentQuestionIndex >= config.questions.length) {
    // Build complete Q&A context for completed surveys
    const qaContext = config.questions
      .map((question: any, index: number) => {
        // Try indexed ID first (question_0, question_1, etc.), then fallback to question.id
        const indexedId = `question_${index}`;
        const response =
          responses[indexedId] || responses[question.id] || "No response";
        return `Q${index + 1}: ${question.text}\nA${index + 1}: ${response}`;
      })
      .join("\n\n");

    return `
Survey: "${survey.name}" (${config.title})
${survey.description ? `Description: ${survey.description}` : ""}
${config.description ? `Survey Details: ${config.description}` : ""}
${config.aiInstructions ? `AI Instructions: ${config.aiInstructions}` : ""}

**COMPLETE SURVEY RESPONSES**
${qaContext}

**SURVEY COMPLETION FLOW:**
1. Start with completion message: "${config.completionMessage || "Thank you for completing the survey!"}"
2. ${chatbotConfig?.formRecipientEmail ? 'Offer contact form using example below' : 'Suggest alternative contact methods'}

${chatbotConfig?.formRecipientEmail ? `**CONTACT FORM EXAMPLE:**
{
  "bubbles": [
    {"messageType": "text", "content": "${config.completionMessage || "Thank you for completing the survey!"}"},
    {"messageType": "text", "content": "Would you like to get in touch? Please fill out the form below:"},
    {"messageType": "form", "content": "Contact Form", "metadata": {
      "title": "Get in Touch",
      "formFields": [
        {"id": "name", "label": "Name", "type": "text", "placeholder": "Your name", "required": true},
        {"id": "email", "label": "Email", "type": "email", "placeholder": "Your email", "required": true},
        {"id": "message", "label": "Message", "type": "textarea", "placeholder": "How can we help?", "required": true}
      ],
      "submitButton": {"id": "submit_contact", "text": "Send", "action": "submit_form"}
    }}
  ]
}` : ''}
`;
  }

  const currentQuestion = config.questions[currentQuestionIndex];
  const nextQuestionIndex = currentQuestionIndex + 1;

  context += `
**ACTIVE SURVEY CONTEXT**
Survey: "${survey.name}" (${config.title})
${survey.description ? `Description: ${survey.description}` : ""}
${config.description ? `Survey Details: ${config.description}` : ""}
Progress: Question ${currentQuestionIndex + 1} of ${config.questions.length}
${config.aiInstructions ? `AI Instructions: ${config.aiInstructions}` : ""}

**CURRENT QUESTION**
Question ${currentQuestionIndex + 1}: ${currentQuestion.text}
Type: ${currentQuestion.type}
Required: ${currentQuestion.required ? "Yes" : "No"}

**QUESTION TYPE INSTRUCTIONS:**
${getQuestionTypeInstructions(currentQuestion)}
`;

  if (currentQuestion.options && currentQuestion.options.length > 0) {
    const menuType = getMenuTypeForQuestion(currentQuestion);
    context += `
**OPTIONS (MUST PRESENT AS ${menuType.toUpperCase()})**
`;
    currentQuestion.options.forEach((option: any, index: number) => {
      context += `${index + 1}. ${option.text}\n`;
    });

    // Generate dynamic menu format example with ALL options
    const optionsForExample = currentQuestion.options
      .map(
        (option: any, index: number) =>
          `      {"id": "option${index + 1}", "text": "${option.text}", "action": "select"}`,
      )
      .join(",\n");

    const menuExample = generateMenuExample(currentQuestion, optionsForExample);

    context += `
**${menuType.toUpperCase()} FORMAT REQUIRED** (MUST INCLUDE ALL ${currentQuestion.options.length} OPTIONS):
${menuExample}

🚨 CRITICAL REQUIREMENTS:
1. You MUST include ALL ${currentQuestion.options.length} options in the ${menuType}
2. Use EXACT option texts - DO NOT change to "Option 1", "Option 2"
3. Never omit any options!
4. Copy the JSON format exactly as shown above

The EXACT option texts you MUST use are: ${currentQuestion.options.map((opt: any) => `"${opt.text}"`).join(", ")}
`;
  } else if (currentQuestion.type === 'rating') {
    context += generateRatingExample(currentQuestion);
  } else if (currentQuestion.type === 'text') {
    // Add skip option for non-required text questions
    if (!currentQuestion.required) {
      context += `
**TEXT INPUT WITH SKIP OPTION:**
This is a voluntary text question. Present it as a text bubble and provide a skip option:
- Use TEXT messageType for the question
- After the question, add quickReplies with "Skip" option in the SAME LANGUAGE as the survey
- User can either type their response or click skip
- CRITICAL: Detect the survey language from question text and localize "Skip" accordingly:
  * Finnish: "Ohita", "Ohita kysymys", or "Siirry seuraavaan"
  * English: "Skip", "Skip this question", or "Next"
  * Swedish: "Hoppa över", "Hoppa över frågan"
  * Other languages: Use appropriate translation

Example format for Finnish survey:
[
  {"messageType": "text", "content": "${currentQuestion.text} (Vapaaehtoinen)"},
  {"messageType": "quickReplies", "content": "", "metadata": {"quickReplies": ["Ohita kysymys"]}}
]
`;
    } else {
      context += `
**REQUIRED TEXT INPUT:**
This is a required text question. Present it as a text bubble and wait for user input.
`;
    }
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
          const questionIndex = config.questions.findIndex(
            (q: any) => q.id === qId,
          );
          context += `Q${questionIndex + 1}: ${question.text}\nA${questionIndex + 1}: ${answer}\n\n`;
        } else {
          context += `${qId}: ${answer}\n`;
        }
      }
    });
  }

  context += `
**SURVEY FLOW REQUIRED:**
🚨 CRITICAL: This is a COMPLETELY NEW SURVEY. Ignore all previous survey content in chat history.
🌍 LANGUAGE LOCALIZATION: Detect the survey language from question texts and respond in the SAME language. Localize all responses, acknowledgments, and interface elements (like "Skip", "Thank you", etc.) to match the survey language.
`;

  // Check if this might be a survey restart (question 1 but user just requested survey)
  const isLikelyRestart =
    currentQuestionIndex === 0 && Object.keys(responses).length === 0;

  // Different instructions based on survey progress
  if (isLikelyRestart) {
    // Starting or restarting survey - need introduction
    context += `
1. Clear new survey introduction: "Let's start a new survey. ${config.description || "This fresh assessment will help us understand your current needs."}"
2. Present current question: "Question 1: ${currentQuestion.text}"
3. Menu with exact options listed above (DO NOT create different options)

Format: [intro bubble, question bubble, menu bubble]
CRITICAL: Do not reference any previous survey results or questions from chat history.
`;
  } else if (Object.keys(responses).length > 0) {
    // User just responded - need acknowledgment + next question
    context += `
1. Brief acknowledgment: "Thank you for your response" or similar validation
2. Present next question: "Question ${currentQuestionIndex + 1}: ${currentQuestion.text}"  
3. Menu with exact options listed above (DO NOT create different options)

Format: [acknowledgment bubble, question bubble, menu bubble]
CRITICAL: Continue with THIS survey only. Do not reference previous survey results.
`;
  } else {
    // Continuing survey without recent response
    context += `
1. Present current question: "Question ${currentQuestionIndex + 1}: ${currentQuestion.text}"
2. Menu with exact options listed above (DO NOT create different options)

Format: [question bubble, menu bubble]
CRITICAL: Focus only on THIS survey. Ignore any previous survey content in chat history.
`;
  }

  context += `
**IMPORTANT**: This is question ${currentQuestionIndex + 1} of ${config.questions.length}.
`;

  return context;
}

// Helper function to get question type specific instructions
function getQuestionTypeInstructions(question: any): string {
  const requiredText = question.required ? 'REQUIRED' : 'OPTIONAL';
  switch (question.type) {
    case 'single_choice':
      return `This is a ${requiredText} SINGLE CHOICE question. Use MENU messageType (allows only one selection).`;
    case 'multiple_choice':
      return `This is a ${requiredText} MULTIPLE CHOICE question. Use MULTISELECT_MENU messageType (allows multiple selections). 🚨 CRITICAL: Use EXACT option texts from survey - DO NOT use "Option 1", "Option 2"!`;
    case 'text':
      const skipText = question.required ? '' : ' If optional, provide a skip option using quickReplies.';
      return `This is a ${requiredText} TEXT question. Use TEXT messageType and prompt for free-form text input.${skipText}`;
    case 'rating':
      return `This is a ${requiredText} RATING question. Use RATING messageType with appropriate scale (1-5 stars, 1-10 numbers, etc.).`;
    case 'conditional':
      return `This is a ${requiredText} CONDITIONAL question. Use appropriate messageType based on the question structure.`;
    default:
      return 'Use appropriate messageType based on question content.';
  }
}

// Helper function to determine menu type for question
function getMenuTypeForQuestion(question: any): string {
  switch (question.type) {
    case 'single_choice':
      return 'menu';
    case 'multiple_choice':
      return 'multiselect_menu';
    case 'conditional':
      return 'menu'; // Default to single choice for conditional
    default:
      return 'menu';
  }
}

// Helper function to generate menu example based on question type
function generateMenuExample(question: any, optionsForExample: string): string {
  const menuType = getMenuTypeForQuestion(question);

  if (menuType === 'multiselect_menu') {
    return `🚨 CRITICAL MULTISELECT FORMAT - COPY EXACTLY:
{
  "messageType": "multiselect_menu",
  "content": "Select all that apply:",
  "metadata": {
    "allowMultiple": true,
    "minSelections": 1,
    "maxSelections": ${question.options?.length || 999},
    "options": [
${optionsForExample}
    ]
  }
}

⚠️ WARNING: You MUST use the EXACT option texts provided above. DO NOT change them to "Option 1", "Option 2". Use the actual text from the survey options!`;
  } else {
    return `{
  "messageType": "menu",
  "content": "Please select one option:",
  "metadata": {
    "options": [
${optionsForExample}
    ]
  }
}`;
  }
}

// Helper function to generate rating example
function generateRatingExample(question: any): string {
  const metadata = question.metadata || {};
  const minValue = metadata.minValue || 1;
  const maxValue = metadata.maxValue || 5;
  const ratingType = metadata.ratingType || 'stars';

  return `
**RATING FORMAT REQUIRED**:
{
  "messageType": "rating",
  "content": "Please provide your rating:",
  "metadata": {
    "minValue": ${minValue},
    "maxValue": ${maxValue},
    "ratingType": "${ratingType}",
    "step": 1
  }
}
`;
}