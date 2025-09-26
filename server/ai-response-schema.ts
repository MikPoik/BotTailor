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

${isSurveyActive ? `**SURVEY MODE ACTIVE:**
- Follow the ACTIVE SURVEY CONTEXT section for specific question details and format requirements
- Use exact option texts provided in survey context (never modify or invent options)` : ''}

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

**Card Example:**
{
  "bubbles": [
    {
      "messageType": "card",
      "content": "Special Offer",
      "metadata": {
        "title": "Summer Sale",
        "description": "Get 20% off all products this month!",
        "imageUrl": "https://example.com/summer-sale.jpg",
        "buttons": [
          {
            "id": "view_products",
            "text": "View Products",
            "action": "navigate",
            "payload": {"url": "/products"}
          },
          {
            "id": "learn_more",
            "text": "Learn More",
            "action": "message",
            "payload": {"message": "Tell me more about the sale"}
          }
        ]
      }
    }
  ]
}

**Quick Replies Usage Guidelines:**
Use quickReplies for:
- Simple yes/no questions
- Quick acknowledgments or confirmations  
- Short responses that don't need detailed options
- When you want users to respond with predefined short phrases
- Follow-up questions after providing information

**Quick Replies Examples:**

For yes/no questions:
{
  "bubbles": [
    {
      "messageType": "text",
      "content": "Would you like me to help you get started with creating your first chatbot?",
      "metadata": {
        "quickReplies": ["Yes, please!", "No, thanks"]
      }
    }
  ]
}

For quick confirmations:
{
  "bubbles": [
    {
      "messageType": "text", 
      "content": "I can help you with pricing information, technical documentation, or getting started guides. What would you prefer?",
      "metadata": {
        "quickReplies": ["Pricing", "Documentation", "Getting Started"]
      }
    }
  ]
}

For follow-up responses:
{
  "bubbles": [
    {
      "messageType": "text",
      "content": "That's great! I've provided the information above. Is there anything specific you'd like me to explain further?",
      "metadata": {
        "quickReplies": ["Yes, explain more", "No, I'm good", "Show me examples"]
      }
    }
  ]
}

**When to use Quick Replies vs Menu:**
- Use quickReplies for: Simple choices, yes/no, short responses, casual interactions
- Use menu for: Complex options with descriptions, structured navigation, formal selections, when options need icons or detailed explanations


**For Interactive/Conversational Content:**

🚨 **CRITICAL DYNAMIC VALIDATION RULE**: When you plan to provide interactive choices (menus/quickreplies), YOU MUST add expectation metadata to the PRECEDING text bubble:
- Add expectedMenuOptions: number if you plan to follow with a menu (REQUIRED for surveys)
- Add expectedQuickReplies: number if you plan to follow with quick replies
- Add contentIntent: description to describe your plan (e.g., "survey_question_1", "greeting_menu")
- Add completionRequired: true for surveys to ensure all options are generated

🔴 **CRITICAL**: Put expectation metadata in the QUESTION TEXT bubble, NOT the menu bubble!
This ensures validation catches missing menus even if AI stops generating before the menu bubble.

${isSurveyActive ? `⚠️ **SURVEY VALIDATION**: This metadata enables validation that ensures ALL intended menu options are generated and prevents truncation!`: ''}

Use multiple shorter bubbles to create natural dialogue flow.

Example for regular greetings and options:
{
  "bubbles": [
    {"messageType": "text", "content": "Hi there! 👋"},
    {"messageType": "text", "content": "How can I help you today? Would you like to learn more about:", "metadata": {"expectedMenuOptions": 3, "contentIntent": "greeting_menu"}},
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

🚨 **CRITICAL: Response Format Requirements** 🚨
- ALWAYS wrap your response in a "bubbles" array - THIS IS MANDATORY
- NEVER send a single message object directly  
- Even for simple single responses, use: {"bubbles": [{"messageType": "text", "content": "your message"}]}
- Invalid format: {"messageType": "text", "content": "message"}
- Correct format: {"bubbles": [{"messageType": "text", "content": "message"}]}
- **EVERY RESPONSE MUST START WITH:** {"bubbles":[
- **EVERY RESPONSE MUST END WITH:** ]}
- **NO EXCEPTIONS** - All responses require the bubbles array wrapper
`;

  // Add survey context if provided
  const surveyInstructions = surveyContext || "";

  return `${customPrompt}\n\n${structureInstructions}\n\n${surveyInstructions}`;
}

// Function to build survey context for AI when a survey is active
export function buildSurveyContext(survey: any, surveySession: any, chatbotConfig?: any): string {
  const config = survey.surveyConfig;
  const currentQuestionIndex = surveySession.currentQuestionIndex || 0;
  const responses = surveySession.responses || {};

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
        const qKey = `q${index}`;
        let response = responses[indexedId] || responses[question.id] || responses[qKey] || "No response";

        // Format complex response objects properly
        if (typeof response === 'object' && response !== null) {
          if (response.rating) {
            response = `Rating: ${response.rating}`;
          } else if (response.selected_options_with_text && Array.isArray(response.selected_options_with_text)) {
            // Extract text from each object in the array
            response = response.selected_options_with_text.map((item: any) => item.text || item).join(', ');
          } else if (response.selected_options && Array.isArray(response.selected_options)) {
            response = response.selected_options.join(', ');
          } else {
            response = JSON.stringify(response);
          }
        }

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

**🎯 SURVEY COMPLETION FLOW - REQUIRED ACTIONS:**
🚨 CRITICAL: The survey is now COMPLETED. You must:

1. **Completion Acknowledgment**: Start with: "${config.completionMessage || "Thank you for completing the survey!"}"

2. **Personalized Summary**: Based on the responses above, provide a personalized summary and recommendation about which services would be most suitable. Analyze the user's answers and give specific guidance.

3. **Next Steps**: ${chatbotConfig?.formRecipientEmail ? 'Present the contact form using the format below' : 'Suggest alternative contact methods like phone or email'}

🔴 **MANDATORY**: Use all three elements above in sequence - acknowledgment, personalized summary, and contact form.

${chatbotConfig?.formRecipientEmail ? `
**🔴 MANDATORY CONTACT FORM FORMAT:**
After providing the personalized summary, present the contact form using this structure but translating content:

{
  "bubbles": [
    {"messageType": "text", "content": "${config.completionMessage || "Thank you for completing the survey!"}"},
    {"messageType": "text", "content": "[YOUR PERSONALIZED SUMMARY AND RECOMMENDATIONS BASED ON RESPONSES]"},
    {"messageType": "text", "content": "Would you like to get in touch? Fill out the contact form:"},
    {"messageType": "form", "content": "Contact", "metadata": {
      "title": "Contact Us",
      "formFields": [
        {"id": "name", "label": "Name", "type": "text", "placeholder": "Your Name", "required": true},
        {"id": "email", "label": "Email", "type": "email", "placeholder": "Your Email Address", "required": true},
        {"id": "message", "label": "Message", "type": "textarea", "placeholder": "How can we help?", "required": true}
      ],
      "submitButton": {"id": "submit_contact", "text": "Send", "action": "submit_form"}
    }}
  ]
}

🚨 **CRITICAL REQUIREMENTS:**
- Replace [YOUR PERSONALIZED SUMMARY...] with actual analysis of user's responses
- Provide specific service recommendations based on their answers
- Use the same language as the survey questions for all text
- Include the contact form as the final step` : ''}

**🔴 COMPLETION CONTEXT REMINDER:**
This is a COMPLETED survey. Do not ask more questions. Focus on:
1. Confirming completion
2. Analyzing responses to provide personalized recommendations
3. Facilitating next steps with contact form or alternative contact methods

**SURVEY ANALYSIS GUIDANCE:**
Based on the complete responses above, analyze:
- What services would be most appropriate for this user
- Any urgent concerns that require immediate attention
- Specific recommendations tailored to their situation and timeline
- Appropriate tone (supportive, professional, understanding)

Provide concrete, actionable guidance rather than generic responses.
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

**🚨 CRITICAL SURVEY FLOW INSTRUCTION 🚨**
IMMEDIATELY present the next question - DO NOT just acknowledge the previous response!

**CURRENT QUESTION** (MUST PRESENT NOW)
Question ${currentQuestionIndex + 1}: ${currentQuestion.text}
Type: ${currentQuestion.type}
Required: ${currentQuestion.required ? "Yes" : "No"}

**QUESTION TYPE INSTRUCTIONS:**
${getQuestionTypeInstructions(currentQuestion)}

**RESPONSE FORMAT REQUIREMENT:**
1. Brief acknowledgment and validation of user's response (1 sentence max), adjust to current survey context. Example: "Thank you for your response, I understand your situation." 
2. IMMEDIATELY present Question ${currentQuestionIndex + 1} with the appropriate ${currentQuestion.type} bubble
3. 🔴 **CRITICAL VALIDATION**: Include expectation metadata in the QUESTION TEXT bubble (NOT the menu): expectedMenuOptions: ${(() => {
  if (!currentQuestion.options) return 0;
  if (!currentQuestion.allowFreeChoice) return currentQuestion.options.length;
  // Check if there's already an "Other" option
  const hasExistingOther = currentQuestion.options.some((option: any) => 
    option.text?.toLowerCase().trim() === 'other' ||
    option.text?.toLowerCase().includes('other')
  );
  // If no existing "Other", add one (+1). If existing "Other", replace it (same count)
  return hasExistingOther ? currentQuestion.options.length : currentQuestion.options.length + 1;
})()}, contentIntent: "survey_question_${currentQuestionIndex + 1}", completionRequired: true
${currentQuestion.allowFreeChoice ? `4. 🌍 **LANGUAGE-AWARE FREE CHOICE**: ${(() => {
  if (!currentQuestion.options) return 'Add an "Other" option with id="q_other"';
  const hasExistingOther = currentQuestion.options.some((option: any) => 
    option.text?.toLowerCase().trim() === 'other' ||
    option.text?.toLowerCase().includes('other')
  );
  return hasExistingOther ? 'REPLACE existing "Other" option with id="q_other"' : 'ADD new "Other" option with id="q_other"';
})()}. Translate the visible text to match survey language naturally.` : ''}
`;

  if (currentQuestion.options && currentQuestion.options.length > 0) {
    const menuType = getMenuTypeForQuestion(currentQuestion);

    // Check for existing "Other" option and prepare effective options
    let effectiveOptions = [...currentQuestion.options];
    let hasExistingOther = false;
    let finalOptionCount = effectiveOptions.length;

    if (currentQuestion.allowFreeChoice) {
      // Check if there's already an "Other" option (by text)
      hasExistingOther = effectiveOptions.some(option => 
        option.text?.toLowerCase().trim() === 'other' ||
        option.text?.toLowerCase().includes('other')
      );

      // If no existing "Other" option, we'll add one (so +1 to count)
      // If there's already an "Other" option, we'll replace it (so same count)
      if (!hasExistingOther) {
        finalOptionCount = effectiveOptions.length + 1;
      }
    }

    context += `
**OPTIONS (MUST PRESENT AS ${menuType.toUpperCase()})**
`;
    effectiveOptions.forEach((option: any, index: number) => {
      context += `${index + 1}. ${option.text}\n`;
    });

    // Generate dynamic menu format example with ALL options (including "Other" if enabled)
    const optionsForExample = effectiveOptions
      .map(
        (option: any, index: number) =>
          `      {"id": "${option.id || `option${index + 1}`}", "text": "${option.text}", "action": "select"}`,
      )
      .join(",\n");

    const menuExample = generateMenuExample(currentQuestion, optionsForExample);

    context += `
**${menuType.toUpperCase()} FORMAT REQUIRED** (MUST INCLUDE ALL ${finalOptionCount} OPTIONS):
${menuExample}

🚨 CRITICAL REQUIREMENTS:
1. You MUST include ALL ${finalOptionCount} options in the ${menuType}
2. Use EXACT option texts for predefined options - DO NOT change to "Option 1", "Option 2"
3. Never omit any options!
4. Copy the JSON format exactly as shown above
5. 🔴 **CRITICAL VALIDATION METADATA**: Add expectation metadata to the QUESTION TEXT bubble (NOT the menu): {"expectedMenuOptions": ${finalOptionCount}, "contentIntent": "survey_question_${currentQuestionIndex + 1}", "completionRequired": true}
${currentQuestion.allowFreeChoice ? (hasExistingOther ? 
`6. 🌍 **REPLACE EXISTING "OTHER"**: There's already an "Other" option in the predefined options. REPLACE it with id="q_other" and translate the text to match the survey language naturally (e.g., "Muu" for Finnish, "Other" for English, etc.). Do NOT add an additional "Other" option.` : 
`6. 🌍 **ADD "OTHER" OPTION**: Add a localized "Other" option with id="q_other". Translate the visible text to match the survey language naturally (e.g., "Muu" for Finnish, "Andet" for Danish, "Other" for English, etc.)`) : ''}

The predefined option texts you MUST use are: ${effectiveOptions.map((opt: any) => `"${opt.text}"`).join(", ")}${currentQuestion.allowFreeChoice ? (hasExistingOther ? ` (replace any "Other" with localized version and id="q_other")` : ` + localized "Other" option`) : ''}
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
      // Format complex response objects properly
      let formattedAnswer = answer;
      if (typeof answer === 'object' && answer !== null) {
        const responseObj = answer as any;
        if (responseObj.rating) {
          formattedAnswer = `Rating: ${responseObj.rating}`;
        } else if (responseObj.selected_options_with_text && Array.isArray(responseObj.selected_options_with_text)) {
          // Extract text from each object in the array
          formattedAnswer = responseObj.selected_options_with_text.map((item: any) => item.text || item).join(', ');
        } else if (responseObj.selected_options && Array.isArray(responseObj.selected_options)) {
          formattedAnswer = responseObj.selected_options.join(', ');
        } else {
          formattedAnswer = JSON.stringify(answer);
        }
      }

      // Handle indexed question IDs (question_0, question_1, etc.)
      const indexMatch = qId.match(/^question_(\d+)$/);
      if (indexMatch) {
        const questionIndex = parseInt(indexMatch[1], 10);
        const question = config.questions[questionIndex];
        if (question) {
          context += `Q${questionIndex + 1}: ${question.text}\nA${questionIndex + 1}: ${formattedAnswer}\n\n`;
        } else {
          context += `${qId}: ${formattedAnswer}\n`;
        }
      } else {
        // Fallback: try to find question by ID
        const question = config.questions.find((q: any) => q.id === qId);
        if (question) {
          const questionIndex = config.questions.findIndex(
            (q: any) => q.id === qId,
          );
          context += `Q${questionIndex + 1}: ${question.text}\nA${questionIndex + 1}: ${formattedAnswer}\n\n`;
        } else {
          context += `${qId}: ${formattedAnswer}\n`;
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
  // Calculate effective option count including "Other" if allowFreeChoice is enabled
  const baseOptionCount = question.options?.length || 0;
  const optionCount = question.allowFreeChoice ? baseOptionCount + 1 : baseOptionCount;

  if (menuType === 'multiselect_menu') {
    return `🚨 CRITICAL MULTISELECT FORMAT - COPY EXACTLY:
{
  "bubbles": [
    {"messageType": "text", "content": "${question.text}", "metadata": {"expectedMenuOptions": ${optionCount}, "contentIntent": "survey_question", "completionRequired": true}},
    {"messageType": "multiselect_menu", "content": "Select all that apply:", "metadata": {
      "allowMultiple": true,
      "minSelections": 1,
      "maxSelections": ${optionCount},
      "options": [
${optionsForExample}
      ]
    }}
  ]
}

🚨 **CRITICAL VALIDATION POINT**: The expectation metadata MUST be in the question text bubble, NOT the menu bubble!
This ensures validation catches missing menus even if AI stops generating before the menu bubble.

⚠️ WARNING: You MUST use the EXACT option texts provided above. DO NOT change them to "Option 1", "Option 2". Use the actual text from the survey options!`;
  } else {
    return `🚨 CRITICAL MENU FORMAT - COPY EXACTLY:
{
  "bubbles": [
    {"messageType": "text", "content": "${question.text}", "metadata": {"expectedMenuOptions": ${optionCount}, "contentIntent": "survey_question", "completionRequired": true}},
    {"messageType": "menu", "content": "Please select one option:", "metadata": {
      "options": [
${optionsForExample}
      ]
    }}
  ]
}

🚨 **CRITICAL VALIDATION POINT**: The expectation metadata MUST be in the question text bubble, NOT the menu bubble!
This ensures validation catches missing menus even if AI stops generating before the menu bubble.

⚠️ WARNING: You MUST use the EXACT option texts provided above. DO NOT change them to "Option 1", "Option 2". Use the actual text from the survey options!`;
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