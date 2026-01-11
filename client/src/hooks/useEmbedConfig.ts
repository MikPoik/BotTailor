import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { CTAConfig } from "@shared/schema";

export interface EmbedConfig {
  embedId: string;
  designType: "minimal" | "compact" | "full";
  theme: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
  };
  ui: {
    welcomeMessage?: string;
    welcomeType: "text" | "form" | "buttons";
    inputPlaceholder: string;
    showAvatar: boolean;
    showTimestamp: boolean;
    headerText?: string;
    footerText?: string;
    hideBranding: boolean;
  };
  components: Array<{
    name: string;
    visible: boolean;
    order?: number;
  }>;
  chatbotGuid: string;
  chatbotName: string;
  chatbotConfigId?: number;
  apiUrl?: string;
  ctaConfig?: CTAConfig;
}

/**
 * Hook to fetch embed configuration by embedId
 * Used by the public embed page
 */
export function useEmbedConfig(embedId: string) {
  return useQuery<EmbedConfig>({
    queryKey: [`/api/public/embed/${embedId}`],
    enabled: !!embedId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook to get embed config from window globals (injected by server)
 * Used when embed config is already injected into HTML
 */
export function useEmbedConfigFromWindow(): EmbedConfig | null {
  if (typeof window === "undefined") {
    return null;
  }

  return (window as any).__EMBED_CONFIG__ || null;
}

/**
 * Hook to apply theme colors to the page
 * Injects CSS variables that can be used by components
 */
export function useEmbedTheme(theme: EmbedConfig["theme"]) {
  // This function is intentionally a no-op in hook form
  // Theme colors should only be applied to the specific embed container
  // via inline styles in the component, NOT globally to document/body
  // See EmbedChatInterface.tsx for container-scoped color application
  return null;
}

/**
 * Hook to constrain scrolling to iframe and prevent bubbling to parent
 * Ensures message list only scrolls internally
 */
export function useEmbedScroll(containerRef: React.RefObject<HTMLDivElement>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      const isScrollable = container.scrollHeight > container.clientHeight;
      if (!isScrollable) {
        return;
      }

      const isAtTop = container.scrollTop === 0 && e.deltaY < 0;
      const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 1 && e.deltaY > 0;

      if (isAtTop || isAtBottom) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Allow touch scrolling within container
      if (container.contains(e.target as Node)) {
        const isScrollable = container.scrollHeight > container.clientHeight;
        if (!isScrollable) {
          return;
        }
        
        // Let the browser handle standard touch behavior within the scrollable container
        // Only prevent default if we're trying to scroll past the boundaries
        const isAtTop = container.scrollTop === 0;
        const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 1;
        
        // We don't preventDefault here to allow native elastic scroll or just normal scroll
        // The wheel handler covers the desktop case which is more prone to bubbling
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, [containerRef]);
}

/**
 * Hook to ensure embed renders with proper size and no overflow
 * Only sets HTML/body styles in embedded/iframe mode, NOT in preview mode
 */
export function useEmbedLayout() {
  useEffect(() => {
    // Only apply layout changes in embedded mode (iframe), not in preview
    const isEmbedded = typeof window !== "undefined" && 
      (new URLSearchParams(window.location.search).get("embedded") === "true" ||
       (window as any).__EMBED_CONFIG__?.embedded === true);
    
    if (!isEmbedded) {
      return; // Don't modify document in preview mode
    }

    const html = document.documentElement;
    const body = document.body;

    // Store original styles
    const originalHtmlStyle = {
      height: html.style.height,
      width: html.style.width,
      margin: html.style.margin,
      padding: html.style.padding,
      overflow: html.style.overflow,
    };

    const originalBodyStyle = {
      height: body.style.height,
      width: body.style.width,
      margin: body.style.margin,
      padding: body.style.padding,
      overflow: body.style.overflow,
    };

    // Apply embed styles only in embedded mode
    html.style.height = "100%";
    html.style.width = "100%";
    html.style.margin = "0";
    html.style.padding = "0";
    html.style.overflow = "hidden";

    body.style.height = "100%";
    body.style.width = "100%";
    body.style.margin = "0";
    body.style.padding = "0";
    body.style.overflow = "hidden";

    return () => {
      // Restore original styles on unmount
      html.style.height = originalHtmlStyle.height;
      html.style.width = originalHtmlStyle.width;
      html.style.margin = originalHtmlStyle.margin;
      html.style.padding = originalHtmlStyle.padding;
      html.style.overflow = originalHtmlStyle.overflow;

      body.style.height = originalBodyStyle.height;
      body.style.width = originalBodyStyle.width;
      body.style.margin = originalBodyStyle.margin;
      body.style.padding = originalBodyStyle.padding;
      body.style.overflow = originalBodyStyle.overflow;
    };
  }, []);
}

/**
 * Hook to manage session ID for embed
 * Gets from window config or generates new one
 */
export function useEmbedSession() {
  const sessionIdRef = useRef<string | null>(null);

  if (typeof window === "undefined") {
    return null;
  }

  // Get from window config first
  if ((window as any).__EMBED_CONFIG__?.sessionId) {
    return (window as any).__EMBED_CONFIG__.sessionId;
  }

  // Generate if not in config
  if (!sessionIdRef.current) {
    sessionIdRef.current = `embed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  return sessionIdRef.current;
}

/**
 * Hook to check if we're in embed mode
 */
export function useIsEmbedded() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    new URLSearchParams(window.location.search).get("embedded") === "true" ||
    (window as any).__EMBED_CONFIG__?.embedded === true
  );
}
