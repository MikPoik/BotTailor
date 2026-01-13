# Documentation for server/openai/cta-generator.ts

CTA Generator Service

 Uses OpenAI to generate complete CTA configurations from natural language prompts
 Supports streaming generation for better UX
/
For button_group type:

 Generate a CTA configuration from a natural language prompt
/
Extract JSON from response (handle markdown code blocks)
Parse and validate the generated config
Generate description of what was created

 Generate CTA with streaming support
/
Collect all chunks
Parse and validate