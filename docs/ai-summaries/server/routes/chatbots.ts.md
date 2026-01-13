# AI Summary: server/routes/chatbots.ts

# Chatbot Routes Documentation

## Purpose
The `chatbots.ts` file contains routes for managing chatbots within an Express application. It provides endpoints for creating, retrieving, updating, and checking configurations of chatbots, ensuring that only authenticated users can interact with their own chatbot data. 

## Key Functions
- **setupChatbotRoutes(app: Express)**: Sets up the chatbot management routes for the Express application.
  - **GET /api/chatbots**: Retrieves all chatbots associated with an authenticated user.
  - **GET /api/chatbots/:guid**: Retrieves a specific chatbot configuration by its GUID for the authenticated user.
  - **POST /api/chatbots**: Creates a new chatbot configuration, with a check to enforce the user's subscription limits on active chatbots.
  - **PUT /api/chatbots/:guid**: Updates an existing chatbot configuration by its GUID, ensuring the user owns the chatbot before allowing modifications.

## Dependencies
- **Express**: To define the web server's routing and middleware.
- **storage**: A custom module for database interactions, handling chatbot configurations.
- **@shared/schema**: Provides schema definitions for validating chatbot configurations using `zod`.
- **zod & zod-validation-error**: Libraries for schema validation and error handling.
- **neonAuth**: Custom middleware to check if users are authenticated before accessing the chatbot routes.
- **openai**: Used for generating prompts and surveys relevant to chatbot functionality, although not explicitly used in the routes documented.

## Architectural Context
The routes defined in this file are expected to work in conjunction with other files in the application:
- It relies on the `storage` module for database operations, promoting separation of concerns where database logic is abstracted away from routing.
- The use of schemas from `@shared/schema` ensures that data integrity is maintained when creating or updating chatbot configurations.
- Authentication is enforced across all chatbot-related routes, providing security and user data segmentation.
- This file acts as a controller layer, orchestrating the flow of data between the client-facing API and the underlying data storage or processing layers. 

By maintaining a clear structure and separation of responsibilities, the system is scalable and easy to maintain and extend in the future.