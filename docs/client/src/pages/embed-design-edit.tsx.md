# Documentation for client/src/pages/embed-design-edit.tsx

Check if creating new by looking at the URL path
Fetch existing design
Create/Update mutation
Structure data for backend API
Prefer theme values from CTA config when present so iframe container
settings edited inside the CTA editor are persisted to the top-level
embed theme used by the iframe renderer.
Include CTA configuration when present
Also invalidate the specific embed query so reopening the editor fetches fresh data
Use the embedId from the response to ensure correct navigation
Update preview in real-time
Ensure CTA config is included — prefer the form value, then local preview state, then existing design
Use form values for preview if available, otherwise use database design