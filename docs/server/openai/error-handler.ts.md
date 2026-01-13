# Documentation for server/openai/error-handler.ts

Generate fallback response for error cases
/

 Attempt to salvage a malformed response by parsing it as a single message
/
Try to extract content if it's a plain text response
Try to find any content that looks like a message
Try to parse as plain text if JSON parsing fails

 Handle parsing errors with appropriate logging and fallback
/
Always try to salvage if we have content, regardless of error type
Return fallback response

 Handle critical errors with logging
/