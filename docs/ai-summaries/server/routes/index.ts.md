# AI Summary: server/routes/index.ts

# Code File Summary: `server/routes/index.ts`

## Purpose
The `index.ts` file serves as the central hub for routing in an Express application. It initializes and organizes various route modules to handle different functionalities such as authentication, chat, surveys, public access, file uploads, and more. This modular approach enhances maintainability and scalability of the application by separating concerns.

## Key Functions
- **`registerRoutes(app: Express): Promise<Server>`**: 
  - **Input**: An Express application instance.
  - **Output**: Returns a Promise that resolves to an HTTP Server.
  - **Functionality**:
    - Invokes setup functions for multiple route modules.
    - Ensures ordering of routes to prevent conflicts (e.g., embedding routes before public routes).
    - Sets up specific routes for API interactions such as subscriptions and webhooks.
    - Creates and returns an HTTP server from the configured Express app.

## Dependencies
- **Express**: The core framework used for building the web application.
- **http**: Node.js module utilized to create an HTTP server.
- **Route Modules**: 
  - `auth`: Authentication related routes.
  - `chat`: Chat-related functionalities.
  - `chatbots`: Chatbot functionalities.
  - `surveys`: Handles survey routes.
  - `public`: Public-facing routes.
  - `uploads`: Manages file uploads.
  - `websites`: Related to website functionalities.
  - `ui-designer`: Routes for UI design features.
  - `contact`: Handling user contact features.
  - `embeds`: Manages embedded content.
  - **CTA AI**: Specific API routes for call-to-action AI generation.
  - **Subscriptions**: Handles subscription-related routes and webhook management for integration with services like Stripe. 

Overall, this file is crucial for establishing the routing infrastructure of the server while collaborating with various functionalities structured across different modules.