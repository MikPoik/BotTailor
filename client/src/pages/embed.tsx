import { useParams } from "wouter";
import { useEmbedConfigFromWindow, useEmbedConfig, useEmbedSession } from "@/hooks/useEmbedConfig";
import { EmbedChatInterface } from "@/components/embed/EmbedChatInterface";
import { useEffect, useMemo } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { widgetQueryClient } from "@/lib/widgetQueryClient";
import { ChatSessionProvider } from "@/contexts/chat-session-context";
import { ThemeProvider } from "@/contexts/theme-context";

/**
 * Public embed page that renders a chat interface for iframe embedding
 * Route: /embed/:embedId
 *
 * The page receives configuration either:
 * 1. From window.__EMBED_CONFIG__ (injected by server in production)
 * 2. From API call (in development or as fallback)
 * 
 * Uses widgetQueryClient and dedicated providers to isolate the embed
 * from the main app's state management, preventing flashing on interactions.
 */
export default function EmbedPage() {
  const { embedId } = useParams();

  // Try to get config from window first (injected by server)
  const windowConfig = useEmbedConfigFromWindow();

  // Fallback to API call if no window config
  const { data: apiConfig, isLoading: configLoading, isFetching, isError } = useEmbedConfig(embedId || "");

  // Use whichever config is available
  const config = windowConfig || apiConfig;

  // Memoize config to prevent unnecessary provider re-initializations
  const memoizedConfig = useMemo(() => config, [config?.embedId, config?.designType, config?.chatbotConfigId]);

  // Set page title
  useEffect(() => {
    if (config?.chatbotName) {
      document.title = config.chatbotName;
    }
  }, [config?.chatbotName]);

  // Debug: log when the resolved embed config becomes available
  useEffect(() => {
    console.debug('[EmbedPage] memoizedConfig', { embedId: memoizedConfig?.embedId, ctaEnabled: !!memoizedConfig?.ctaConfig?.enabled });
  }, [memoizedConfig]);

  // Loading/error handling: avoid rendering a fallback default config while
  // the real config is still loading. Rendering a local default then
  // replacing it with the real config causes a visible re-render/flash.
  if (!memoizedConfig) {
    // If we're still fetching (or no embedId was provided), show a loading state
    if (configLoading || isFetching || !embedId) {
      return (
        <div className="flex items-center justify-center h-screen bg-white">
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-gray-600">Loading chat...</p>
          </div>
        </div>
      );
    }

    // Not fetching and still no config — show an error
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-red-600 font-semibold">Unable to load chat</p>
          <p className="text-gray-600 text-sm">The embed configuration could not be loaded.</p>
          {embedId && <p className="text-gray-400 text-xs">ID: {embedId}</p>}
        </div>
      </div>
    );
  }

  const apiUrl = windowConfig?.apiUrl || window.location.origin;

  // Provide a fallback config if memoizedConfig is undefined
  // You may want to define a defaultConfig object elsewhere or inline here
  const defaultConfig = {
    embedId: embedId || "",
    designType: "full" as const,
    theme: {
      primaryColor: "#2563eb",
      backgroundColor: "#ffffff",
      textColor: "#111827",
    },
    ui: {
      welcomeMessage: "Welcome!",
      welcomeType: "text",
      inputPlaceholder: "Type your message...",
      showAvatar: true,
      showTimestamp: true,
      headerText: "Chatbot",
      footerText: "",
      hideBranding: false,
    },
    components: [],
    chatbotGuid: "",
    chatbotName: "Chatbot",
    chatbotConfigId: undefined,
    apiUrl: apiUrl,
    ctaConfig: undefined,
  };

  // Prefer explicit session resolution via hook (respects URL param, injected window config, or stored session)
  const embeddedSession = useEmbedSession();

  return (
    <QueryClientProvider client={widgetQueryClient}>
      <ThemeProvider>
        <ChatSessionProvider initialSessionId={embeddedSession}>
          <EmbedChatInterface config={memoizedConfig ?? defaultConfig} apiUrl={apiUrl} />
        </ChatSessionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
