# Documentation for server/routes/ui-designer.ts

POST /api/ui-designer/generate - Generate new home screen config
Handle both old format (just config) and new format (config + explanation)
Backward compatibility - treat result as config
POST /api/ui-designer/modify - Modify existing home screen config
Pre-validate and sanitize the current config before schema validation
Ensure currentConfig has required structure
Ensure components array exists
Sanitize each component's topics to ensure they're arrays
Handle both old format (just config) and new format (config + explanation)
Backward compatibility - treat result as config