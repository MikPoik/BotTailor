import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

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
  useEffect(() => {
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty("--embed-primary", theme.primaryColor);
    root.style.setProperty("--embed-bg", theme.backgroundColor);
    root.style.setProperty("--embed-text", theme.textColor);

    // Also set Tailwind color variables
    root.style.setProperty("--background", theme.backgroundColor);
    root.style.setProperty("--foreground", theme.textColor);
    root.style.setProperty("--primary", theme.primaryColor);

    // Set inline styles on body
    document.body.style.backgroundColor = theme.backgroundColor;
    document.body.style.color = theme.textColor;

    return () => {
      root.style.removeProperty("--embed-primary");
      root.style.removeProperty("--embed-bg");
      root.style.removeProperty("--embed-text");
    };
  }, [theme]);
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
        e.preventDefault();
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
          e.preventDefault();
        }
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
 * Sets HTML/body to 100% height with no margins
 */
export function useEmbedLayout() {
  useEffect(() => {
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

    // Apply embed styles
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
