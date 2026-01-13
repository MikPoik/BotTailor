# Documentation for client/src/pages/embed.tsx

Public embed page that renders a chat interface for iframe embedding
 Route: /embed/:embedId

 The page receives configuration either:
 1. From window.__EMBED_CONFIG__ (injected by server in production)
 2. From API call (in development or as fallback)

 Uses widgetQueryClient and dedicated providers to isolate the embed
 from the main app's state management, preventing flashing on interactions.
/
Try to get config from window first (injected by server)
Fallback to API call if no window config
Use whichever config is available
Memoize config to prevent unnecessary provider re-initializations
Set page title
Loading state
Error state
Provide a fallback config if memoizedConfig is undefined
You may want to define a defaultConfig object elsewhere or inline here