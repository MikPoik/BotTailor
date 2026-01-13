# Documentation for client/src/components/chat/message-bubble.tsx

Color resolution function that prioritizes embed parameters over UI Designer theme
Track which messages have already played their entrance animation
Log mount/unmount and render
Mark message as animated on first render
Format timestamp as HH:MM
Handle skip with metadata
Handle regular quick reply
Only re-render if message content changed - ignore parent state changes