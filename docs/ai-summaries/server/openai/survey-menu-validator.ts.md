# AI Summary: server/openai/survey-menu-validator.ts

# Summary of `survey-menu-validator.ts`

## Purpose
The `survey-menu-validator.ts` file is responsible for validating survey menu requirements in an AI-driven application. It checks if the generated responses from the AI align with the expected survey question formats (e.g., menu, multiselect menu, rating). This ensures the integrity of survey interactions by matching user expectations with the system's outputs.

## Key Functions
1. **`validateSurveyMenuRequirements(sessionId: string, validated: AIResponse): Promise<SurveyValidationResult>`**
   - Main function that validates a survey's menu format based on the user's current session.
   - Retrieves survey session and survey details from storage and checks if the current question requires validation.
   - Validates the presence and format of the generated bubbles (AI responses) against expected question types.
   - Returns an object containing the validation status, metadata about the question, any errors encountered, and whether regeneration of the response is needed.

2. **Supporting Functions:**
   - **`requiresValidation(currentQuestion): boolean`** - Determines if the current question requires validation based on its type.
   - **`buildValidationMetadata(currentQuestion, currentQuestionIndex)`** - Constructs validation metadata specific to the question type being evaluated.
   - **`getQuestionDescription(currentQuestion): string`** - Provides a textual description of the question for error reporting purposes.
   - **`validateBubbleFormat(targetBubble, validationMetadata)`** - Validates the format of the response bubble against the expected criteria.

## Dependencies
- **`AIResponse`** from `../ai-response-schema` - The type representing the AI-generated responses, which includes the bubbles to validate against survey questions.
- **`storage`** from `../storage` - A module that provides access to survey session and survey data, allowing retrieval of necessary information to perform validation checks.

## Architectural Context
This file is part of the server-side architecture of an AI-driven survey application, focusing on ensuring users receive the correct and formatted questions based on their prior responses. It plays a critical role in the interaction between the AI and the user, validating that the AI-generated content adheres to defined requirements for various question types, enhancing user experience and data integrity within the survey ecosystem.