# Documentation for server/routes/chat.ts

Chat-related routes
Select option route (required for menu option interactions)
Check if there's an active survey session and record the response
Get the survey to find the current question
Check if this is a skip response first
Record the survey response with proper formatting
Handle complex payload data for proper storage
For multiselect responses, format properly
Extract text from each object in the array
Use the human-readable text for other cases
Continue with normal response even if survey recording fails
Get chat session messages
Get conversation count for user's chatbots
Get chat sessions for a specific chatbot (authenticated)
Verify the chatbot belongs to the authenticated user
Get paginated chat sessions with multiple messages, total count, and all sessions for aggregated stats
Add message counts for paginated sessions (already filtered at DB level)
Add message counts for all sessions (already filtered at DB level)
Calculate aggregated statistics
Delete individual chat session
Verify the session exists and belongs to a chatbot owned by the user
Delete all chat sessions for a chatbot
Verify the chatbot belongs to the authenticated user
Create new chat session
Ensure session exists
Send welcome message for new sessions
Don't fail session creation if welcome message fails
Send message with streaming response
Set up SSE headers
Flush headers immediately to establish SSE connection
Ensure session exists and handle default chatbot resolution
Skip automatic welcome message creation to allow optimistic UI updates
await createWelcomeMessageIfNeeded(session);
For default chatbot sessions, resolve and store the config ID
Create user message
Send user message confirmation
Check message limits before generating AI response
Check if chatbot is active before processing messages
Use the same fallback message as usage limit exceeded
Send limit exceeded event with same structure as usage limit
Check if the chatbot owner has exceeded their message limit
Use the chatbot's configured fallback message or a default
Send limit exceeded event with read-only mode and fallback message
Increment message usage for successful requests
Could not find chatbot config - return error to prevent bypass
No chatbot config ID available - check against default admin user or deny
Get default chatbot config to check if it's active
No default user configured - deny request to prevent bypass
Handle survey session creation for survey requests
Continue with normal response even if survey creation fails
Handle survey text answers and skip responses
BUT ONLY if this is not from a menu selection (which is handled by select-option endpoint)
Try to parse as JSON first, fallback to plain text
Not JSON, treat as plain text message
Continue with normal response even if handling fails
Generate streaming response
Form submission route - handles form data and sends email via Brevo
Validate required fields
Get chatbot configuration for email settings
Use environment variables or safe defaults for sender information
Only use configured recipient email (no fallbacks for security)
Security check: Ensure recipient email is configured
Prepare form submission data
Store form submission as a message in the chat
Send email via Brevo
Send confirmation message to chat
Send error message to chat
HTTP streaming handler that uses the generator
Get chatbot configuration
Get conversation history
Use the streaming generator
Process the stream
Store the bot message in database and get the created message with ID
Send to client with the database-generated ID
Explicitly flush the response to ensure immediate delivery
Helper function for textual representation of rich messages
Helper function to handle survey text responses (both answers and skips)
Get active survey session
Get survey to check current question
Check if current question is a text question
Extract message content and metadata from the parsed message
Check if it's a skip message
First check for explicit skip metadata, then fall back to text pattern matching
Calculate next state
Record response and advance survey
Extract surveyId from message if present
Get chatbot configuration
If no config ID, try default chatbot
Find target survey first
First deactivate any existing active survey sessions
Check for existing survey session for this specific survey
Update existing session to restart the survey
Reactivate the survey session (it was deactivated above)
Set this survey as active
No existing session, create a new one
Set this survey as active in the chat session