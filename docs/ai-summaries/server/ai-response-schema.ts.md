# AI Summary: server/ai-response-schema.ts

# File Summary: `server/ai-response-schema.ts`

## Purpose
The `ai-response-schema.ts` file defines the schemas used for structuring AI responses within a chatbot. It utilizes the Zod library for schema validation and encompasses various interactive elements such as buttons, options, and form fields, ensuring that the structured data meets defined requirements. The file also provides a function to build a system prompt based on chatbot configuration and survey context.

## Key Functions
### 1. `buildSystemPrompt`
- **Purpose**: Generates a system prompt for the chatbot based on provided configurations and the survey context.
- **Parameters**:
  - `chatbotConfig`: Configuration object for the chatbot.
  - `surveyContext`: Contextual string for active surveys.
  - `isSurveyActive`: Boolean flag indicating if the survey is currently active.
- **Functionality**: 
  - Sets a default prompt if a custom one isn’t provided. 
  - Checks for email configuration related to form submissions.
  - Constructs a list of possible message types based on the chatbot's mode (survey or standard).

## Key Schemas
- **ButtonSchema**: Describes the structure of interactive buttons.
- **OptionSchema**: Outlines the properties for menu options in interactive elements.
- **FormFieldSchema**: Defines the fields required for forms, including types, placeholders, and validation.
- **MessageBubbleSchema**: Details the format for different types of messages (text, cards, menus, etc.) along with optional metadata.
- **AIResponseSchema**: A composite schema for AI responses that consists of an array of message bubbles.

## Dependencies
- **Zod Library**: A TypeScript-first schema declaration and validation library used for defining and validating the various schemas in this file.

### Usage Context
This schema design is crucial for maintaining a consistent structure in AI-driven conversations, facilitating interactive exchanges between users and the chatbot while ensuring data integrity through validation. The focus on dynamic message types enables the chatbot to adapt its responses based on the user's interaction and context.