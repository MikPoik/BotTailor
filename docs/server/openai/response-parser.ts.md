# Documentation for server/openai/response-parser.ts

Parse accumulated OpenAI response content into validated AIResponse
/
console.log(`[OpenAI] Raw response: ${accumulatedContent}`);
Normalize messageType variants before validation
Validate against schema

 Parse streaming content using best-effort parser
/
Normalize early so streaming logic can reason on canonical types

 Validate if a bubble is complete and ready for streaming
/
Type-specific validation
For cards with buttons, ensure they're complete

 Validate survey menu requirements
/

 Detect if JSON content appears to be ending/complete
/
Check for bubble separators
Check for card completion patterns
Check for general message type completion
--- Helpers: normalize messageType variants from model ---
Common variants → canonical
Lowercased fallbacks