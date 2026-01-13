# AI Summary: server/routes/websites.ts

# Architectural Overview of `websites.ts`

## Purpose
The `websites.ts` file provides RESTful API endpoints for managing website content sources related to chatbots within an Express application. It facilitates retrieval, addition, and deletion of website sources, ensuring that only authenticated users can access or modify the resources associated with their chatbots.

## Key Functions
1. **`setupWebsiteRoutes(app: Express)`**: Configures the routes for website source management.
   
   - **GET `/api/chatbots/:chatbotId/website-sources`**: 
     - Retrieves website sources for a specified chatbot.
     - Validates chatbot ownership based on user authentication.
     - Returns 404 if the chatbot is not found and 500 on failure.

   - **POST `/api/chatbots/:chatbotId/website-sources`**: 
     - Adds a new content source (website, text, or file) to a specified chatbot.
     - Validates the input data based on the source type and parses it using a Zod schema.
     - Initiates background processing to scan a website or process text content.
     - Handles validation errors and responds with appropriate status codes.
     - Returns 500 on failure.

   - **DELETE `/api/chatbots/:chatbotId/website-sources/:sourceId`**:
     - Deletes a specified website source associated with a chatbot after verifying ownership.
     - Returns 404 if the chatbot or source is not found.

## Dependencies
- **Express**: Framework for building the API.
- **`@shared/schema`**: Contains the Zod schema for validating website source data.
- **`zod` & `zod-validation-error`**: Libraries used for schema validation and error handling.
- **`../storage`**: Module for data storage and retrieval operations related to chatbots and sources.
- **`../neonAuth`**: Middleware for user authentication to authorize requests.
- **`../website-scanner`**: Class to handle scanning of websites and processing of text content.
- **`../upload-service`**: Facilitates the uploading of text files (though its use is less prominent in this file). 

## Summary
This file is a crucial part of the application, managing the lifecycle of website sources tied to chatbots. By utilizing a structured route setup and validation mechanisms, it ensures a secure and efficient means for users to manage their content.