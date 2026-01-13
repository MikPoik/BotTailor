# Documentation for server/ai-response-schema.ts

Define the button schema for interactive elements
Define the option schema for menu items
Define the form field schema for form inputs
Define individual message bubble schema
Rating specific metadata
Multiselect specific metadata
Survey specific metadata
Define the AI response schema for multi-bubble responses
Function to build system prompt with chatbot config and survey context
Default system prompt if no chatbot config is provided
Use chatbot's custom system prompt or fall back to default
Check if email configuration is properly set up for forms
Build message types list conditionally based on survey context
Add survey-specific message types only when in survey mode
Technical structure instructions for message formatting
Add survey context if provided
Function to build survey context for AI when a survey is active
Strong directive to ignore previous surveys
If survey is completed
Build complete Q&A context for completed surveys
Try indexed ID first (question_0, question_1, etc.), then fallback to question.id
Format complex response objects properly
Extract text from each object in the array
Check if there's already an "Other" option
If no existing "Other", add one (+1). If existing "Other", replace it (same count)
Check for existing "Other" option and prepare effective options
Check if there's already an "Other" option (by text)
If no existing "Other" option, we'll add one (so +1 to count)
If there's already an "Other" option, we'll replace it (so same count)
Generate dynamic menu format example with ALL options (including "Other" if enabled)
Add skip option for non-required text questions
Build Q&A pairs for previous responses
Format complex response objects properly
Extract text from each object in the array
Handle indexed question IDs (question_0, question_1, etc.)
Fallback: try to find question by ID
Check if this might be a survey restart (question 1 but user just requested survey)
Different instructions based on survey progress
Starting or restarting survey - need introduction
User just responded - need acknowledgment + next question
Continuing survey without recent response
Helper function to get question type specific instructions
Helper function to determine menu type for question
Helper function to generate menu example based on question type
Calculate effective option count including "Other" if allowFreeChoice is enabled
Helper function to generate rating example