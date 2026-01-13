# AI Summary: server/ui-designer-service.ts

# UI Designer Service Documentation

## Purpose
The `ui-designer-service.ts` file is responsible for generating JSON configurations for chatbot home screens. Utilizing OpenAI's API, this service creates engaging and user-friendly UI layouts while adhering to specified schemas and guidelines.

## Key Functions
1. **createSystemPrompt(availableSurveys: any[])**
   - Generates a system prompt for the OpenAI model that describes the roles and responsibilities of a UI designer for chatbot home screen configurations.
   - Constructs a detailed description of available component types and properties, survey integration guidelines, and styling recommendations.
   - Ensures adherence to critical requirements for JSON output, including mandatory fields like `id`, `order`, `visible`, `type`, and `props`.

## Dependencies
- **OpenAI**: Interacts with OpenAI's API (requires `OPENAI_API_KEY` environment variable).
- **zod**: Used for schema validation (imported but not directly utilized in the provided code snippet).
- **@shared/schema**: Imports `HomeScreenConfigSchema` and `HomeScreenConfig` types for validation of the generated configuration structure. 

## Architectural Context
This service is part of a larger architecture that leverages AI to enhance user interactions with chatbots. By focusing on a structured and standardized approach to UI design, it helps in creating consistent experiences across various chatbot implementations. The integration of surveys allows for dynamic content tailored to user needs, improving engagement rates. The use of schemas ensures that configurations are valid and maintain the integrity of the data being utilized.