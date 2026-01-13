# Documentation for client/src/pages/survey-builder.tsx

Use BaseSurvey type directly to ensure compatibility
Helper function to safely get surveyConfig
Type-safe handling of unknown surveyConfig
Local state for editing fields to prevent constant updates
Update local state when selectedSurvey changes
Track changes to enable save button
Fetch chatbot details
Fetch surveys for this chatbot
Create survey mutation
Update survey mutation
Only invalidate queries to refetch data - this updates the list
Update the selected survey in local state to prevent UI jumps
Update local form state for name/description
Update local settings state if surveyConfig changed
Clear unsaved changes flags
Delete survey mutation
Swap with previous question
Swap with next question
Save survey details function
Local state for editing questions to prevent constant updates
Local state for question settings to prevent immediate saves
Local state for survey settings
Update local settings state when selectedSurvey changes
Track changes to settings
Editing mode
Clear local state for deleted option and adjust indices
Adjust indices for remaining options
Update the question immediately
Prepare all updates for this question
Save question text if changed
Save all option texts if changed
Clear all option text changes for this question
Save local question settings if changed
Apply all updates at once
Clear local changes
Clear option text changes
Clear question settings changes
View mode
Clear any pending local settings for this question when entering edit mode