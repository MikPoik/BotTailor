# AI Summary: server/openai/index.ts

# Summary of `server/openai/index.ts`

## Purpose
The `index.ts` file serves as the main entry point for a modular OpenAI service, ensuring backward compatibility with the legacy `openai-service.ts`. Its primary function is to re-export various functionalities, utilities, and types from multiple modules related to response generation, client management, context building, response parsing, error handling, and schema definitions.

## Key Functions
The file re-exports key functions and data types, allowing other parts of the application to access them conveniently. Here are the modules it interacts with:

- **Response Generation**
  - `generateMultiBubbleResponse`
  - `generateOptionResponse`
  - `generateStructuredResponse`
  - `generatePromptAssistance`
  - `generateSurveyAssistance`
  
- **Streaming Handling**
  - `generateStreamingResponse`
  
- **Client Utilities**
  - `getOpenAIClient`
  - `isOpenAIConfigured`

- **Context Building**
  - `buildWebsiteContext`
  - `buildActiveSurveyContext`
  - `buildCompleteSystemPrompt`

- **Response Parsing**
  - `parseOpenAIResponse`
  - `parseStreamingContent`
  - `isBubbleComplete`
  - `validateSurveyMenuRequirements`

- **Error Handling**
  - `generateFallbackResponse`
  - `handleParseError`
  - `handleCriticalError`

- **Schema and Type Exports**
  - `MULTI_BUBBLE_RESPONSE_SCHEMA`
  - TypeScript types: `ConversationMessage`, `ChatConfig`, `StreamingBubbleEvent`

## Dependencies
This file depends on the following modules within the same directory:

- `./response-generator`
- `./streaming-handler`
- `./client`
- `./context-builder`
- `./response-parser`
- `./error-handler`
- `./schema`

Through these dependencies, `index.ts` facilitates a cohesive architecture that allows for modular and maintainable code, while also providing a convenient interface for other components in the application to interact with OpenAI's functionalities.