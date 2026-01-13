# Documentation for server/openai/streaming-handler.ts

Build enhanced system prompt for dynamic content regeneration
/
Add specific requirements based on expectations
Add specific error fixes
Add truncation warnings
Add warnings

 Regenerate response for dynamic content validation failures
/
Build enhanced system prompt with specific dynamic content requirements
Prepare messages with enhanced system prompt
Extract configuration (same as original request)
Make non-streaming regeneration call for faster processing
Parse the regenerated response

 Build enhanced system prompt for regeneration based on validation failures
/
Build specific enhancement based on expected message type
Add specific error details
Add detected bubble info if available

 Regenerate response using enhanced prompt with validation requirements
/
Build enhanced system prompt with specific validation requirements
Prepare messages with enhanced system prompt
Extract configuration (same as original request)
Make non-streaming regeneration call for faster processing
Parse the regenerated response

 Clean up completed survey sessions after first completion response
/

 Generate streaming response with bubble-by-bubble parsing
/
Build complete system prompt with all contexts
Use last 10 messages for better context in streaming
Extract configuration
Prepare messages
Create streaming request with retry logic
Wait 1 second before retry
Streaming state
Helper function to manage bubble delays
Process streaming chunks
console.log(`[OpenAI STREAM] Received chunk, accumulated: ${accumulatedContent.length} chars`);
Try to parse and yield complete bubbles
Process all complete bubbles, yielding non-menu ones immediately
Skip if already yielded
Skip menu and multiselect_menu bubbles during streaming
They will be processed in the final step to ensure completeness
Final processing
Enhanced survey menu validation with regeneration capability
Dynamic content validation for non-survey interactive elements
Log dynamic validation results
Attempt regeneration with enhanced prompt
Re-validate the regenerated response
Handle dynamic content validation failures with regeneration
Skip dynamic regeneration if we already regenerated for survey validation
to avoid double regeneration conflicts
Attempt regeneration with enhanced prompt for dynamic content
Re-validate the regenerated response
Yield any remaining bubbles that weren't processed during streaming
This includes menu/multiselect bubbles that were skipped
Skip if this bubble was already yielded during streaming
Clean up completed survey sessions to prevent repeated injection
Try to salvage the response
Skip already yielded bubbles
Clean up completed survey sessions to prevent repeated injection
Final fallback