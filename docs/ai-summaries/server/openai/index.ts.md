# AI Summary: server/openai/index.ts

# Summary of `server/openai/index.ts`

## Purpose 
This file serves as a modular entry point for the OpenAI service implementation. It facilitates backward compatibility with an earlier version (`openai-service.ts`) while exposing various functionalities necessary for interaction with OpenAI's API and managing related responses.

## Key Functions
- **Response Generation**: 
  - `generateMultiBubbleResponse`
  - `generateOptionResponse`
  - `generateStructuredResponse`
  - `generatePromptAssistance`
  - `generateSurveyAssistance`
  
- **Streaming Response Handling**:
  - `generateStreamingResponse`
  
- **Client Utilities**:
  - `getOpenAIClient`
  - `isOpenAIConfigured`
  
- **Context Building**:
  - `buildWebsiteContext`
  - `buildActiveSurveyContext`
  - `buildCompleteSystemPrompt`
  
- **Response Parsing**:
  - `parseOpenAIResponse`
  - `parseStreamingContent`
  - `isBubbleComplete`
  - `validateSurveyMenuRequirements`
  
- **Error Handling**:
  - `generateFallbackResponse`
  - `handleParseError`
  - `handleCriticalError`
  
- **Schema and Types**:
  - Exposes `MULTI_BUBBLE_RESPONSE_SCHEMA`.
  - TypeScript types: `ConversationMessage`, `ChatConfig`, and `StreamingBubbleEvent`.

## Dependencies
This file depends on several modules within the same directory:
- `response-generator.ts`
- `streaming-handler.ts`
- `client.ts`
- `context-builder.ts`
- `response-parser.ts`
- `error-handler.ts`
- `schema.ts`

Each of these modules provides specialized functionalities that contribute to the overall operation of the OpenAI service within the application, ensuring a structured and cohesive architecture.