# Documentation for server/routes/public.ts

Helper function to find the correct path for static files in both dev and prod
Try production path first (dist/public)
Try development path (public)
Try alternative production path (./public relative to server)
Public API routes (no authentication required)
Serve embed.js static file (handle both with and without trailing slash)
Handle trailing slash version as well
Serve embed.css static file
Serve SEO assets (robots.txt, sitemap.xml) regardless of environment
Get default chatbot configuration for public access
Get surveys available for public home screen
Public API to get chatbot configuration for embed widget
Get chatbot config from database
Return only the public configuration data needed for the embed widget
Embed route with optional GUID parameter
If an embed SPA config is already prepared by upstream middleware (embeds route in dev),
skip serving the legacy HTML and let Vite catch-all render the SPA.
Determine path to static files based on environment
Fallback HTML if embed.html doesn't exist
If a specific GUID is requested, add it to the widget config
REMOVED: Conflicting route that was redirecting instead of injecting config
Route guard to prevent incorrect widget URLs from being served by Vite catch-all
This blocks URLs like /:userId/:chatbotGuid that should be /widget/:userId/:chatbotGuid
Only match very specific patterns to avoid interfering with valid routes
Only apply this guard to requests that look exactly like widget URLs
User ID should be numeric (5+ digits), chatbot GUID should be UUID format
Also check that this isn't an API call or other known route
This looks like an incorrect widget URL - return 404 with helpful message
If it doesn't match the widget pattern, continue to next middleware
Chat widget route with user and chatbot parameters - only match specific patterns
Get chatbot config from database
Extract theme configuration from chatbot config or use defaults
Force HTTPS in production environments
Try different possible paths
Inject session data and chatbot config into the HTML
In development, inject config and let Vite dev server handle the rest