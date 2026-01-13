# Documentation for client/src/hooks/useEmbedConfig.ts

Hook to fetch embed configuration by embedId
 Used by the public embed page
/

 Hook to get embed config from window globals (injected by server)
 Used when embed config is already injected into HTML
/

 Hook to apply theme colors to the page
 Injects CSS variables that can be used by components
/
This function is intentionally a no-op in hook form
Theme colors should only be applied to the specific embed container
via inline styles in the component, NOT globally to document/body
See EmbedChatInterface.tsx for container-scoped color application

 Hook to constrain scrolling to iframe and prevent bubbling to parent
 Ensures message list only scrolls internally
/
Allow touch scrolling within container
Let the browser handle standard touch behavior within the scrollable container
Only prevent default if we're trying to scroll past the boundaries
We don't preventDefault here to allow native elastic scroll or just normal scroll
The wheel handler covers the desktop case which is more prone to bubbling

 Hook to ensure embed renders with proper size and no overflow
 Only sets HTML/body styles in embedded/iframe mode, NOT in preview mode
/
Only apply layout changes in embedded mode (iframe), not in preview
Store original styles
Apply embed styles only in embedded mode
Restore original styles on unmount

 Hook to manage session ID for embed
 Gets from window config or generates new one
/
Get from window config first
Generate if not in config

 Hook to check if we're in embed mode
/