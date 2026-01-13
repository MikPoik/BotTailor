# Documentation for client/src/pages/chat-widget.tsx

Safe sessionStorage access that handles sandboxed environments
Check if we're in embedded mode
Session ID handling with sessionStorage persistence for development mode
Use session ID from server injection (already optimized for embedded mode)
Development mode: Use global session storage for consistency
Set iframe-friendly styling when embedded
Only show spinner on very first load - never show it again after initialization
Prepare embedded widget data (must be outside conditionals per React hooks rules)
Memoize theme to prevent recreating object on every render
If embedded, show only the chat widget
STRICT VALIDATION: No fallback allowed - must have valid chatbot config
Check if chatbot is active
Otherwise show the full demo page