# Documentation for client/src/lib/markdown-utils.ts

Shared markdown parsing utility
First, clean up any incomplete HTML tags
Remove incomplete HTML tags (anything that starts with < but doesn't close properly)
Remove orphaned closing tags
Clean up malformed anchor tags
Bold text: **text** or __text__
Italic text: *text* or _text_
Markdown links: [text](url) - process before auto-URL detection
Auto-detect URLs (http/https) - but avoid double-processing already linked URLs
Line breaks