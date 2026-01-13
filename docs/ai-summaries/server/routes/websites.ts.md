# AI Summary: server/routes/websites.ts

# Summary of `server/routes/websites.ts`

## Purpose
The `websites.ts` file defines API routes for managing website content sources associated with chatbots in an Express application. It facilitates getting, adding, and deleting website sources which can be either URLs or text files. Authentication is enforced to ensure that users can only manage sources for their own chatbots.

## Key Functions

1. **GET `/api/chatbots/:chatbotId/website-sources`**
   - **Functionality**: Fetch website sources linked to a specified chatbot.
   - **Authentication**: Checks if the user is authenticated.
   - **Ownership Verification**: Validates that the user owns the specified chatbot by checking the `userId` associated with it.

2. **POST `/api/chatbots/:chatbotId/website-sources`**
   - **Functionality**: Add a new website source (website, text, or file) for a specified chatbot.
   - **Input Validation**: Ensures that required fields are provided based on the source type using `insertWebsiteSourceSchema`.
   - **Background Processing**: Initiates either a website scan or text content processing after storing the new source.

3. **DELETE `/api/chatbots/:chatbotId/website-sources/:sourceId`**
   - **Functionality**: Remove a specific website source from a chatbot's sources.
   - **Authentication & Ownership Verification**: Similar checks as in the other routes to ensure the user can delete the source.

## Dependencies

- **Express**: The main web framework for routing and handling HTTP requests.
- **Storage Module** (`../storage`): Manages interactions with the database for retrieving and storing chatbot configurations and website sources.
- **Zod** (`zod`): A schema validation library used to validate incoming data and ensure it conforms to expected formats.
- **Zod Validation Error Handling** (`zod-validation-error`): Translates Zod schema validation errors into user-friendly messages.
- **Authentication Middleware** (`../neonAuth`): Ensures routes are accessible only to authenticated users.
- **Website Scanner Class** (`../website-scanner`): Responsible for scanning websites and processing text content in the background.
- **Upload Service** (`../upload-service`): Potentially involved in handling file uploads, although its usage in the provided code snippet is not highlighted.

## Architectural Context

`websites.ts` serves as a crucial component in the