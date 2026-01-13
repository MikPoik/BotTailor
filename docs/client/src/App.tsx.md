# Documentation for client/src/App.tsx

Check embedded contexts
- Chat widget embed: `embedded=true` or `window.__CHAT_WIDGET_CONFIG__`
- New iframe embed designs: `window.__EMBED_CONFIG__`
Sync user to database on login (right after Stack Auth authentication)
Call /api/ensure-user to sync/create user in app database
Send user profile data for development mode
Don't throw - user will still be able to use the app, just without sync
If chat-widget embed is active (legacy), use ChatWidget routes.
For new embed designs, continue to normal router so /embed/:embedId works.
Wrap auth-dependent routing in ClientOnly to avoid hydration issues
Determine embedded context for layout decisions (hide navbar/footer)
CRITICAL: Keep Suspense for lazy-loaded components but use invisible fallback
This prevents "component suspended" errors while avoiding visible loading states
Cookie consent logic
Initialize consent from localStorage
Load GA when consent is accepted
Initialize dataLayer before script loads
Define gtag function globally
Inject GA script after gtag is defined
Only show modal if not embedded widget and consent not given