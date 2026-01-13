# Documentation for server/openai/context-builder.ts

Optimize search query to 15-40 tokens (60-160 chars) for better vector search
 Language-agnostic approach that works across all languages
/
Normalize whitespace and trim
If query is within optimal range (60-160 chars), use as-is
If too long, intelligently truncate at sentence/phrase boundaries
Try to cut at sentence boundaries first (. ! ? ,)
If we found punctuation in the last 40 chars, cut there
Otherwise, try to cut at last word boundary
If too short (< 60 chars), keep as-is - short queries can still be meaningful
No artificial padding needed

 Build website context from similar content search
/
Build contextual query by including recent conversation history
If the user message is very short (< 20 chars), add context from recent messages
Get last 3 messages for context (exclude the current user message)
Combine recent assistant messages with current query for better context
Combine and ensure we don't exceed 160 chars before optimization
Optimize the search query for better vector search performance

 Build survey context for active surveys
/
Check if current question has options (requires menu)
One-time completion context injection
Mark completion as handled to prevent repeated injections

 Build complete system prompt with all contexts
/
Check if there's an active survey to determine which message types to show
Base system prompt with survey context
Add website context if available, including conversation history for better context
Survey context is already included in buildSystemPrompt above