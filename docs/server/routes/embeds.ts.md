# Documentation for server/routes/embeds.ts

Ensure ESM-compatible __dirname resolution
============================================
PUBLIC ROUTES (No authentication)
============================================

 GET /api/public/embed/:embedId
 Get embed design configuration by public embed ID
 Used by iframe to fetch configuration
/
Return only necessary data for rendering

 GET /embed/:embedId
 Render the embed page with iframe content
 Public route - no authentication required
/
Generate or use provided session ID
Extract theme colors
Force HTTPS in production
Inject session data and embed config into the HTML
Development mode: let Vite serve client app, inject embed config
Hand off to Vite middleware to render SPA route /embed/:embedId
============================================
AUTHENTICATED ROUTES (Require authentication)
============================================

 POST /api/chatbots/:guid/embeds
 Create a new embed design for a chatbot
/
Get chatbot config
Create embed design

 GET /api/chatbots/:guid/embeds
 Get all embed designs for a chatbot
/
Get chatbot config

 GET /api/chatbots/:guid/embeds/:embedId
 Get a specific embed design
/
Get chatbot config
Get embed by public ID and verify ownership

 PUT /api/chatbots/:guid/embeds/:embedId
 Update an embed design
/
Get chatbot config
Get embed and verify ownership

 DELETE /api/chatbots/:guid/embeds/:embedId
 Delete an embed design
/
Get chatbot config
Get embed and verify ownership

 PATCH /api/chatbots/:guid/embeds/:embedId/components/:componentName
 Update component visibility
/
Get chatbot config
Get embed and verify ownership