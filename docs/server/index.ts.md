# Documentation for server/index.ts

Handle webhook routes BEFORE JSON parsing to preserve raw body for Stripe signature verification
Apply JSON parsing to all other routes
Enable trust proxy for proper IP forwarding
Configure CORS to allow cross-origin requests for the embed widget
Setup Neon Auth middleware
Redirect fly.dev development domain to production APP_URL in production
Static files will be served by serveStatic() function in production
or by Vite dev server in development
importantly only setup vite in development and after
setting up all the other routes so the catch-all route
doesn't interfere with the other routes