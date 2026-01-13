# Documentation for client/src/hooks/useStreamingMessage.ts

Custom hook to handle streaming message logic.
 Encapsulates the pattern of:
 1. Sending a streaming message
 2. Adding bubbles to query cache as they arrive
 3. Tracking streaming state and bubble count
/
Just track bubbles - don't add to cache (use-chat.ts handles that)
Keep track of streaming bubbles for counting
Clear the tracking ref since streaming is complete