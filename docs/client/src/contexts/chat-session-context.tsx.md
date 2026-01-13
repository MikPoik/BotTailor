# Documentation for client/src/contexts/chat-session-context.tsx

ChatSessionProvider

 Encapsulates session state for the widget in isolation from the host app.
 Initializes a unique session ID on mount that persists for the widget lifetime.

 Should wrap the entire ChatWidget to provide sessionId and lifecycle state.
/
Seed with provided session if available to keep a stable cross-page session
Initialize session ID on mount or when initialSessionId changes
If caller provided a sessionId and it differs from current state, adopt it

 useChatSession

 Access session state within the widget.
 Only available within a ChatSessionProvider.
/