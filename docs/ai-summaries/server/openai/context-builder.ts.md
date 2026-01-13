# AI Summary: server/openai/context-builder.ts

# Summary of `context-builder.ts`

## Purpose
The `context-builder.ts` file is designed to enhance chatbot responses by optimizing search queries and building contextual information from website content based on user interactions. It ensures that queries are appropriately sized for vector-based searches and combines recent conversation history to provide richer context for responses.

## Key Functions

### 1. `optimizeSearchQuery(query: string): string`
- **Description**: This function normalizes and optimizes a search query to fit within an optimal character range of 60-160 characters. It intelligently truncates long queries at sentence or word boundaries to maintain meaningfulness.
- **Input**: A string `query` representing the user search input.
- **Output**: A refined string that is ready for better vector search performance.

### 2. `buildWebsiteContext(chatbotConfigId: number, searchQuery: string, conversationHistory: Array<{ role: string; content: string }>, maxContentLength: number): Promise<string>`
- **Description**: This asynchronous function constructs a contextual query by combining a user’s search query with recent conversation history if the query is deemed too short. It utilizes the optimized search query to retrieve relevant website content for improved chatbot accuracy.
- **Inputs**: 
  - `chatbotConfigId`: A unique identifier for the chatbot configuration.
  - `searchQuery`: The user's search input.
  - `conversationHistory`: An array of past conversation messages.
  - `maxContentLength`: A limit for response content length (default: 500).
- **Output**: A Promise that resolves to a string containing relevant context from websites.

## Dependencies
- **Local Imports**:
  - `storage`: A module that handles data storage and retrieval, specifically for querying similar content.
  - `buildSystemPrompt`, `buildSurveyContext`: Functions presumably used in response generation that leverage AI response schemas.

This file is part of a larger system that integrates AI response capabilities and relevant data retrieval to enhance the user interaction experience with chatbots.