# Documentation for server/routes/surveys.ts

Survey management routes
Get all surveys for a chatbot
Verify chatbot ownership
Create new survey
Verify chatbot ownership
Update survey
Verify chatbot ownership
Verify survey belongs to this chatbot
Update survey (simplified endpoint for direct survey updates)
Get the existing survey first
Verify ownership through chatbot
Delete all survey history (responses/sessions) for a chatbot
IMPORTANT: Place before the parameterized survey delete route to avoid route collision
Verify chatbot ownership (accept numeric ID or GUID)
Delete survey
Verify chatbot ownership
Verify survey belongs to this chatbot
Survey session management
First deactivate any existing active survey sessions
Check if there's already a survey session for this specific survey
If survey exists and is completed, reset it for restart
Reactivate the existing survey session
Create new survey session
Set this survey as the active survey for the chat session
Record survey response
Get survey config to check for completion
Get survey session status
Survey Analytics endpoint
Verify chatbot ownership (accept numeric ID or GUID)
Delete all survey history (responses/sessions) for a chatbot
Verify chatbot ownership (accept numeric ID or GUID)