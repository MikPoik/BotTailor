# Documentation for client/src/components/chat/prompt-assistant-chatbox.tsx

Function to extract the actual system prompt from AI response
Look for patterns like "**Improved System Prompt:**" or "System Prompt:" followed by the actual prompt
Find the start of the actual prompt (after the pattern and any whitespace/newlines)
Find the end - look for the next "**" or explanation section
If no pattern matches and it's a simple prompt generation, use the whole content
but exclude obvious explanation text
Use setTimeout to ensure the scroll happens after the DOM update
Handle multi-bubble responses by creating separate messages
Single response fallback
Use setTimeout to prevent form auto-submission