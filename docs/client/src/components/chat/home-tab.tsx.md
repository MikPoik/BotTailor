# Documentation for client/src/components/chat/home-tab.tsx

Check if chatbot has custom home screen configuration
If there's a custom config, use dynamic rendering
Handle survey topics specifically
For survey topics, use the object format that handleStartChat expects
For regular message topics, send as string message
console.log("Action:", action);
Handle survey actions specifically
For survey actions, use the object format that handleStartChat expects
For regular chat actions, send as string message
Default: treat any action as a chat starter with string message
Fallback to default home screen