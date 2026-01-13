# Documentation for client/src/components/embed/EmbedChatInterface.tsx

EmbedChatInterfaceRenderer

 Memoized render-only component that receives all props and data.
 Does NOT call hooks - all data is passed in.
 This prevents re-renders when internal hook state changes in parent.
/
Re-render only if key data actually changed

 EmbedChatInterface

 Container component that manages chat logic and state.
 Renders the memoized EmbedChatInterfaceRenderer with stable props.
/
Debug: Log when messages change
Fire streaming immediately for instant visual feedback
Fire-and-forget: selectOption is only for backend tracking, not required for UI
Don't even use startTransition - just fire without awaiting
Silently ignore selection errors - streaming already handled the response
Return memoized renderer with all props