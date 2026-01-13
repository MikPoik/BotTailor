# Documentation for client/src/components/chat/chat-widget.tsx

import { useChat } from "@/hooks/use-chat";
sessionId is required and provided by Portal context
Keep sessionId in state so we can reset the in-memory session without deleting DB records
Fetch default chatbot config if not provided
Generate a unique session ID for this chat widget instance
Get chatbot config ID from injected config or props
Memoize config to ensure stable reference for children
Avoid subscribing ChatWidget to chat queries; provide a lightweight initializer
that creates the session on the server (so it persists) without subscribing
to message queries in the widget itself.
Ensure any cached session/messages for this id are refreshed
Use a stable key that doesn't change on every render
Don't render widget if chatbot is inactive
Resolve theme colors - prioritize props, then chatbot config theme
Support both theme.chat.primary (old) and homeScreenConfig.theme.primaryColor (new)
Apply background/text color to document to avoid flash
Load initial messages from chatbot config
Safe sessionStorage access for initial message persistence
Fail silently
Show initial messages with staggered delays until manually dismissed
Create a unique cache key based on chatbot config and initial messages
Check if initial messages were manually dismissed (default is false/not dismissed)
Note: Removed auto-hide timeout - users must close messages manually
Mark initial messages as shown for this browser session, they will be dismissed on manual close
safeSessionStorage.setItem(messagesHash, 'true'); // This line was removed as it's no longer needed with the new logic.
Hide all initial messages when chat opens
Cleanup timeouts on unmount
Compute header text color based on primary brightness
Inject chat theme CSS and viewport fixes
Start closing animation
Initialize session and messages when chat opens for first time
Remove animation class after it completes to prevent re-triggering on re-renders
If all messages are dismissed, mark them as dismissed in sessionStorage
Do NOT delete messages from DB. Instead, create a new in-memory session id
so future messages are persisted under a new session. This preserves
historical messages for analytics while resetting the active conversation.
Update state to remount chat interface with new session id
Remove any cached queries for the old session so UI resets immediately
Ensure widget visibility - Simplified to remove manual DOM manipulation
and rely on React's state-driven rendering for the bubble and interface
Mobile full-screen interface
Embedded iframe interface
Send close message to parent window
Force GPU acceleration and prevent repaint flash
Keep content visible during re-renders
For non-embedded (development page), show floating widget
Prevent unnecessary re-renders by memoizing the component
This stops the entire widget from re-rendering when React Query updates