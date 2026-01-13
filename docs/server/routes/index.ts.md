# Documentation for server/routes/index.ts

Main route registration function
Set up all route modules
Register embed routes BEFORE public routes to avoid /embed path conflicts
CTA AI generation routes
Webhook route (must be at /api/webhook for Stripe)
Subscription routes
Create and return HTTP server