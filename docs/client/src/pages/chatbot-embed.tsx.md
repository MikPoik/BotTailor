# Documentation for client/src/pages/chatbot-embed.tsx

Redirect to home if not authenticated
Load and initialize chat widget for testing - moved before early returns
Clean up any existing widgets using the reset method
Use the built-in reset method
Fallback manual cleanup if reset method not available
Get theme colors and build widget URL
Small delay to ensure cleanup is complete
Load embed script only if not already loaded
Initialize widget after script loads
Get theme colors from the chatbot configuration
Apply theme colors from UI Designer if available
Widget initialization error - silently fail as it will be retried
If ChatWidget is not available, try again in a short delay
Always call initWidget with a slight delay to ensure cleanup is complete
Cleanup function
Extract clean user ID (part after pipe character)
Get theme colors from UI Designer configuration
Build embed code with UI Designer colors
Clean up and refresh widget for testing