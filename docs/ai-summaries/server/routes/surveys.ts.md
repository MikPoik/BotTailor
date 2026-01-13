# AI Summary: server/routes/surveys.ts

# Summary of `server/routes/surveys.ts`

## Purpose
The `surveys.ts` file defines the API routes for managing surveys associated with chatbots. It provides endpoints for fetching, creating, and updating surveys, with security measures to ensure only authenticated users can access the data and confirm ownership over the chatbots.

## Key Functions
- **setupSurveyRoutes(app: Express)**: Initializes survey management routes on the provided Express application.
  - **GET /api/chatbots/:chatbotId/surveys**: Retrieves all surveys for a specified chatbot. Validates the chatbot ID and checks if the user is the owner.
  - **POST /api/chatbots/:chatbotId/surveys**: Creates a new survey for the specified chatbot. Validates the input data against a schema and checks chatbot ownership.
  - **PUT /api/chatbots/:chatbotId/surveys/:surveyId**: Updates an existing survey for a specified chatbot. Checks ownership of both the chatbot and the survey before applying changes.
  - **PATCH**: A simplified endpoint (not fully visible) for direct survey updates, likely allowing partial updates to survey details.

## Dependencies
- **Express**: A web application framework for Node.js used to create the API routes.
- **storage**: Custom storage module for interacting with the database to fetch and manage chatbot and survey data.
- **@shared/schema**: Contains shared Zod schemas for request validation (e.g., `insertSurveySchema`, `SurveyConfigSchema`).
- **zod**: A TypeScript-first schema declaration and validation library used for parsing and validating input data.
- **zod-validation-error**: A utility for transforming Zod validation errors into a more user-friendly format.
- **neonAuth**: A custom authentication module for verifying user identity and permissions. 

This file plays a critical role in providing a structured way to manage surveys while enforcing user authentication and data integrity.