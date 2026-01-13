import { QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ChatWidget from "./chat-widget";
import { ChatSessionProvider, useChatSession } from "../../contexts/chat-session-context";
import { widgetQueryClient } from "../../lib/widgetQueryClient";
import { ThemeProvider } from "../../contexts/theme-context";

type ChatWidgetPortalProps = {
  containerId?: string;
  sessionId?: string;
  position?: "bottom-right" | "bottom-left";
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  chatbotConfig?: any;
};

/**
 * ChatWidgetPortal
 * 
 * Mounts ChatWidget in a React Portal with:
 * - Separate QueryClient (no cache sharing with host app)
 * - Dedicated ChatSessionProvider (isolated session state)
 * - Dedicated ThemeProvider (isolated theme state)
 * 
 * Benefits:
 * ✅ Host app re-renders don't unmount the widget
 * ✅ Widget mutations don't invalidate host app queries
 * ✅ Widget has its own complete provider stack
 * ✅ Clean encapsulation boundary
 * 
 * Implementation:
 * 1. Creates/finds portal container in DOM
 * 2. Returns React Portal with widget inside provider stack
 * 3. Portal stays mounted regardless of parent re-renders
 */
export function ChatWidgetPortal({
  containerId = "chat-widget-portal-root",
  sessionId,
  ...widgetProps
}: ChatWidgetPortalProps = {}) {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  );

  // Initialize portal container on mount
  useEffect(() => {
    let container = document.getElementById(containerId);

    if (!container) {
      // Create portal container if it doesn't exist
      container = document.createElement("div");
      container.id = containerId;
      // Position it fixed to allow widget to be on top of page content
      container.style.position = "fixed";
      container.style.zIndex = "999999";
      container.style.pointerEvents = "none"; // Don't block clicks on page
      document.body.appendChild(container);
    }

    setPortalContainer(container);

    // Cleanup: only remove if we created it
    return () => {
      const element = document.getElementById(containerId);
      if (element && element.style.position === "fixed") {
        // We created it, clean up only if app is unmounting
        // In practice, leave it for re-mounts to be smooth
      }
    };
  }, [containerId]);

  if (!portalContainer) {
    return null; // Portal not ready yet
  }

  return createPortal(
    <QueryClientProvider client={widgetQueryClient}>
      <ThemeProvider>
        <ChatSessionProvider initialSessionId={sessionId}>
          <ChatWidgetWrapper widgetProps={widgetProps} />
        </ChatSessionProvider>
      </ThemeProvider>
    </QueryClientProvider>,
    portalContainer
  );
}

/**
 * ChatWidgetWrapper
 * 
 * Renders the actual ChatWidget component.
 * Wrapped separately to allow provider context to be accessed
 * by ChatWidget and all descendant components.
 * 
 * Since widget is in portal with its own session context,
 * sessionId is managed internally - auto-initialized on mount.
 */
function ChatWidgetWrapper({ widgetProps }: { widgetProps: Omit<ChatWidgetPortalProps, "containerId" | "sessionId"> }) {
  const { sessionId } = useChatSession();
  
  // SessionId is initialized automatically by ChatSessionProvider
  return (
    <div style={{ pointerEvents: "auto" }}>
      {sessionId ? <ChatWidget sessionId={sessionId} {...widgetProps} /> : null}
    </div>
  );
}
