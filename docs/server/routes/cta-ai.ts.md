# Documentation for server/routes/cta-ai.ts

Schema for CTA generation request

 POST /api/cta/generate
 Generate a CTA configuration from a natural language prompt
/
If streaming is requested, set up SSE
Send chunk as server-sent event
Send final config
Non-streaming response

 POST /api/cta/refine
 Refine an existing CTA based on feedback
/