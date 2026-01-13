# Documentation for client/src/hooks/use-chat.ts

Reset initialization guard when session changes
Safe sessionStorage access that handles sandboxed environments
Initialize session - only create when explicitly requested
Detect embedding modes
Get messages
Use absolute URL when widget is embedded
Allow notifications for streaming updates in all embed modes
notifyOnChangeProps removed to enable real-time streaming bubble updates
placeholderData removed - it was preventing cache updates from showing during streaming
Memoize filtered messages to prevent unnecessary re-renders
Check for existing limit exceeded state on page load
Clear read-only state after a reasonable time (30 minutes) to allow recovery
Streaming message function with real-time bubble parsing
Add optimistic user message to messages array (unless skipped)
Get current data without refetching to preserve optimistic updates
Use absolute URL when widget is embedded (chat widget or new embed)
Process complete lines from buffer
Keep the last line in buffer if it doesn't end with newline
(it might be incomplete)
Skip empty data lines
Always append the bubble to cache for embed/widget
Check if this message already exists by ID (deduplicate)
If this is a user message from server, remove optimistic user message
Always create a new array to ensure React Query detects the change
Don't add messages again - they're already in cache from bubbles
Store in sessionStorage for current session only
Silently skip unparseable lines (could be partial chunks)
Send message mutation (non-streaming fallback)
Optimistically add user message to UI immediately
Add the new bot messages to the existing messages array instead of refetching
Select option mutation - NEVER invalidate queries to prevent flash
Don't create optimistic user message here - streaming will handle it
CRITICAL: Never invalidate queries on option select to prevent flash
Messages are updated via streaming callbacks instead
Function to manually initialize session when chat is opened
Enable and execute session creation immediately
Session initialized - no need to invalidate queries for optimistic UI
Only use sendMessageMutation for isLoading - selectOption is handled by isStreaming
Including selectOptionMutation.isPending causes unnecessary re-renders/flash