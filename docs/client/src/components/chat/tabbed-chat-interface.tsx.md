# Documentation for client/src/components/chat/tabbed-chat-interface.tsx

TabbedChatInterface - Main chat widget component

 Manages:
 - Two-tab UI (Home and Chat)
 - Message streaming and display
 - User interactions (sending messages, selecting options, quick replies)
 - Contact form for message limit exceeded scenarios
 - Theme and color management

 Refactored to use custom hooks:
 - useStreamingMessage: handles streaming message logic
 - useContactForm: manages contact form state and validation
/
UI State
Refs for internal state management
Memoize streaming callbacks to prevent getStreamingHandlers from changing on every render
Custom hooks
DEBUG: Log every render to see what's causing re-renders
DEBUG: Log mount/unmount
Initialize session when component mounts if needed
For test pages or embedded widgets, initialize immediately
For mobile chat, call the provided initialization function
Keep ref in sync with isStreaming state for use in memoized callbacks
Track if we've ever loaded content to prevent showing spinner on refetches
Contact form state
Now managed by useContactForm hook above
Scroll functionality
Message handlers using streaming hooks
Handle selection error silently
Handle error silently
Handle survey action with separate display/internal messages
Handle error silently
Resolve colors with embed parameters taking priority, then chatbot config
Memoize transformed messages to prevent unnecessary re-renders
Use message.id as the primary key source - never fall back to index
This ensures keys remain stable across renders
Only show loading spinner on very first load
DEBUG: Log ChatTab props before render