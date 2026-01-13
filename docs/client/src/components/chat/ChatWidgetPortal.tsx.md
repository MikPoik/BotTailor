# Documentation for client/src/components/chat/ChatWidgetPortal.tsx

ChatWidgetPortal

 Mounts ChatWidget in a React Portal with:
 - Separate QueryClient (no cache sharing with host app)
 - Dedicated ChatSessionProvider (isolated session state)
 - Dedicated ThemeProvider (isolated theme state)

 Benefits:
 ✅ Host app re-renders don't unmount the widget
 ✅ Widget mutations don't invalidate host app queries
 ✅ Widget has its own complete provider stack
 ✅ Clean encapsulation boundary

 Implementation:
 1. Creates/finds portal container in DOM
 2. Returns React Portal with widget inside provider stack
 3. Portal stays mounted regardless of parent re-renders
/
Initialize portal container on mount
Create portal container if it doesn't exist
Position it fixed to allow widget to be on top of page content
Cleanup: only remove if we created it
We created it, clean up only if app is unmounting
In practice, leave it for re-mounts to be smooth

 ChatWidgetWrapper

 Renders the actual ChatWidget component.
 Wrapped separately to allow provider context to be accessed
 by ChatWidget and all descendant components.

 Since widget is in portal with its own session context,
 sessionId is managed internally - auto-initialized on mount.
/
SessionId is initialized automatically by ChatSessionProvider