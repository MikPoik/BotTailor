/**
 * React hooks for embed configuration and theming.
 *
 * Responsibilities:
 * - Fetches embed config by embedId for public embed page.
 * - Provides helpers for reading config from window globals (legacy and new iframe embeds).
 * - Exposes theme and scroll helpers for embed UI.
 *
 * Constraints & Edge Cases:
 * - Must support both legacy and new embed config globals.
 * - Theme application is container-scoped, not global.
 * - Scroll handling must prevent bubbling to parent in iframe.
 */
import { useQuery } from "@tanstack/react-query";
import { logger as importLogger } from "@/lib/logger";
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
  // Apply theme colors in embedded (iframe) mode to avoid flash
  // We keep this embedded-only and restore original values on unmount
  // so we don't pollute host pages in preview/development mode.
  
  if (typeof window === "undefined") return null;

  const isEmbedded =
    new URLSearchParams(window.location.search).get("embedded") === "true" ||
    (window as any).__EMBED_CONFIG__?.embedded === true;

  // Only manipulate document-level styles in embedded mode
  if (!isEmbedded) return null;

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    // Save originals so we can restore on cleanup
    const original = {
      htmlVars: {
        bg: html.style.getPropertyValue("--embed-bg"),
        text: html.style.getPropertyValue("--embed-text"),
        primary: html.style.getPropertyValue("--embed-primary"),
      },
      bodyBg: body.style.backgroundColor,
    };

    try {
      if (theme?.backgroundColor) {
        html.style.setProperty("--embed-bg", theme.backgroundColor);
        body.style.backgroundColor = theme.backgroundColor;
      }
      if (theme?.textColor) html.style.setProperty("--embed-text", theme.textColor);
      if (theme?.primaryColor) html.style.setProperty("--embed-primary", theme.primaryColor);
    } catch (e) {
      // Ignore errors in tight sandboxed or CSP locked environments
      // Use debug logger to avoid noisy output in production
      importLogger?.debug?.("useEmbedTheme: failed to set theme vars", e);
    }

    return () => {
      try {
        // Restore original vars (empty string means remove inline var)
        if (original.htmlVars.bg) html.style.setProperty("--embed-bg", original.htmlVars.bg);
        else html.style.removeProperty("--embed-bg");

        if (original.htmlVars.text) html.style.setProperty("--embed-text", original.htmlVars.text);
        else html.style.removeProperty("--embed-text");

        if (original.htmlVars.primary) html.style.setProperty("--embed-primary", original.htmlVars.primary);
        else html.style.removeProperty("--embed-primary");

        body.style.backgroundColor = original.bodyBg;
      } catch (e) {
        // Ignore restore errors
      }
    };
  }, [theme]);

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

    // Store original inline style text so we can restore in one operation
    const originalHtmlCss = html.getAttribute('style') || '';
    const originalBodyCss = body.getAttribute('style') || '';

    // Compose a single cssText for layout to avoid multiple sequential attribute mutations
    const newHtmlCss = `${originalHtmlCss} height: 100%; width: 100%; margin: 0; padding: 0; overflow: hidden;`;
    const newBodyCss = `${originalBodyCss} height: 100%; width: 100%; margin: 0; padding: 0; overflow: hidden;`;

    try {
      if (html.getAttribute('style') !== newHtmlCss) html.setAttribute('style', newHtmlCss);
      if (body.getAttribute('style') !== newBodyCss) body.setAttribute('style', newBodyCss);
    } catch (e) {
      // Best-effort: ignore CSP or sandbox restrictions
      try {
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
      } catch (e2) {
        // ignore
      }
    }

    return () => {
      // Restore original inline styles in a single operation
      try {
        if (originalHtmlCss) html.setAttribute('style', originalHtmlCss);
        else html.removeAttribute('style');

        if (originalBodyCss) body.setAttribute('style', originalBodyCss);
        else body.removeAttribute('style');
      } catch (e) {
        // ignore restore errors
      }
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

  const win = window as any;

  // If server injected a sessionId, prefer it (server-controlled sessions)
  if (win.__EMBED_CONFIG__?.sessionId) {
    return win.__EMBED_CONFIG__.sessionId;
  }

  // Determine embed mode and storage key
  const isEmbedded =
    new URLSearchParams(window.location.search).get("embedded") === "true" ||
    win.__EMBED_CONFIG__?.embedded === true;

  const storageKey = isEmbedded ? "embed-session-id" : "global-chat-session-id";

  // Prefer explicit sessionId in URL query (used by host embed script)
  const urlSessionId = new URLSearchParams(window.location.search).get("sessionId");
  if (urlSessionId) {
    sessionIdRef.current = urlSessionId;
    try {
      sessionStorage.setItem(storageKey, urlSessionId);
    } catch (e) {
      // ignore storage failures in sandboxed environments
    }
    return urlSessionId;
  }

  if (!sessionIdRef.current) {
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(storageKey);
    } catch (e) {
      stored = null;
    }

    if (stored) {
      sessionIdRef.current = stored;
    } else {
      const uuidv4 = () =>
        "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });

      const newId =
        typeof crypto !== "undefined" && (crypto as any).randomUUID
          ? (crypto as any).randomUUID()
          : uuidv4();

      sessionIdRef.current = newId;
      try {
        sessionStorage.setItem(storageKey, newId);
      } catch (e) {
        // ignore storage failures in sandboxed environments
      }
    }
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
