# Documentation for server/storage.ts

Storage interface and implementation for the application.
 Handles database operations for users, chat sessions, messages, and configurations.
/
User operations (required for Replit Auth)
Chat session methods
Message methods
Chatbot config methods
Website source methods
Website content methods
Survey methods
Survey session methods
Active survey tracking methods
Survey analytics methods
Survey history deletion
Conversation count methods
Subscription plan methods
Subscription methods
User operations (required for Replit Auth)
Chat session methods
First delete all messages for this session
Delete all survey sessions for this chat session
Finally delete the chat session
Get all chat sessions for this chatbot
Delete all messages for these sessions
Delete all survey sessions for these chat sessions
Delete all chat sessions for this chatbot
Message methods
Chatbot config methods
First, get all chat sessions for this chatbot
Delete all messages for these sessions
Delete all survey sessions for these chat sessions
Delete all chat sessions for this chatbot
Delete all surveys for this chatbot
Survey sessions are already deleted above, so just delete the surveys
Delete all website sources and their content for this chatbot
Delete website content first
Then delete the source
Finally, delete the chatbot config
Website source methods
First delete all website content for this source
Then delete the source
Website content methods
Get all website sources for this chatbot
Generate embedding for the query using OpenAI
Convert embedding to PostgreSQL vector format
Use pgvector cosine distance for similarity search across all sources
Execute vector similarity search using pgvector
Simple deduplication based on content
Use first 300 characters as a simple duplicate check
Stop when we have enough unique results
Survey methods
First delete all survey sessions for this survey
Then delete the survey
Find all surveys belonging to this chatbot
Delete all survey sessions linked to these surveys
Use iterative deletion to avoid importing extra helpers; keeps behavior explicit
Survey session methods
Active survey tracking methods
First get the chat session to find the active survey ID
Then get the specific survey session for that survey
Mark all survey sessions for this chat session as inactive
Conversation count method
Count unique sessions that are connected to this user's chatbots
Subscription plan methods
Subscription methods
First check if user already has a subscription
Get the free plan
Create free subscription for user
Admin user exclusion - bypass all bot limits
Get user's current subscription with plan, or create free subscription
Auto-assign free subscription for new users
Count only active bots
Check if under limit (-1 means unlimited)
Admin user exclusion - bypass all message limits
Get user's current subscription with plan, or create free subscription
Auto-assign free subscription for new users
Check if under limit (-1 means unlimited)
Survey analytics implementation
Get chatbot config to find the ID
Get all surveys for this chatbot
Get all survey sessions for this survey
Consider sessions as completed if they have responses for most questions or are marked inactive/completed
Count as completed if they answered most questions
Calculate average completion time for completed/inactive sessions with responses
Use updatedAt as completion time for inactive sessions
Analyze questions and responses
Try multiple possible question ID formats
Handle different response formats
Calculate overall statistics
Create user message
Generate bot response
Store bot response