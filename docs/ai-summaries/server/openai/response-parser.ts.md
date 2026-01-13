# AI Summary: server/openai/response-parser.ts

# Overview of `response-parser.ts`

The `response-parser.ts` file is responsible for parsing and validating response content from OpenAI, turning raw text into structured data that adheres to predefined schemas. It plays a vital role in ensuring that the data being processed is both accurate and complete, enabling seamless interactions in applications that utilize OpenAI's responses.

## Key Functions

1. **`parseOpenAIResponse(accumulatedContent: string): AIResponse`**
   - Parses accumulated string content from OpenAI responses.
   - Normalizes and validates the parsed content against the `AIResponseSchema`.
   - Returns a validated `AIResponse` or handles parse errors gracefully.

2. **`parseStreamingContent(accumulatedContent: string): { success: boolean; bubbles?: any[]; error?: any; }`**
   - Uses a best-effort JSON parser to handle streaming responses.
   - Extracts "bubbles" from the parsed result, normalizing their format for further processing.

3. **`isBubbleComplete(bubble: any): boolean`**
   - Validates whether individual bubbles (components of the response) are complete and ready for use.
   - Checks for necessary fields based on the bubble's `messageType`, including types like "menu," "form," "text," and "card."

4. **`validateSurveyMenuRequirements(sessionId: string, validated: AIResponse): Promise<void>`**
   - Validates the requirements for a survey menu based on the current session status and survey configuration.
   - Interacts with storage to check session and survey states asynchronously.

## Dependencies

- **`best-effort-json-parser`**: Used for parsing streaming content, allowing graceful handling of incomplete or malformed JSON data.
- **`../ai-response-schema`**: Imports the AIResponseSchema for validating the structured format of the AI responses.
- **`./error-handler`**: Provides utility functions to handle parsing errors and attempt to salvage responses.
- **`../storage`**: Accesses the storage module for retrieving survey sessions and related data needed for validation.

## Architectural Context

This file is a part of the server-side logic that interacts with OpenAI's API, functioning as a middleware for parsing and validating responses before they are processed further or presented to users. It is essential for maintaining data integrity and ensuring that user interactions with the AI system are reliable and meaningful. The modular design facilitates easy updates and enhancements, such as modification of validation