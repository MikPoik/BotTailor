import React, { useRef, useEffect, useState } from "react";
import { useEmbedTheme, useEmbedLayout, useEmbedScroll, useEmbedSession } from "@/hooks/useEmbedConfig";
import { useChat } from "@/hooks/use-chat";
import { MinimalEmbed } from "./embed-designs/MinimalEmbed";
import { CompactEmbed } from "./embed-designs/CompactEmbed";
import { FullEmbed } from "./embed-designs/FullEmbed";
import { Loader } from "lucide-react";
import "./embed-chat-interface.css";

interface EmbedConfig {
  designType: "minimal" | "compact" | "full";
  theme: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
  };
  ui: {
    headerText?: string;
    welcomeMessage?: string;
    inputPlaceholder: string;
    footerText?: string;
    hideBranding?: boolean;
    showAvatar?: boolean;
    showTimestamp?: boolean;
    chatbotConfig?: any;
  };
  components: Array<{
    name: string;
    visible: boolean;
  }>;
  chatbotConfigId?: number;
}

interface EmbedChatInterfaceProps {
  config: EmbedConfig;
  apiUrl: string;
}

/**
 * Main wrapper component for iframe-based embed chats
 * Supports multiple design variants (minimal, compact, full)
 * Handles theme application, layout, scroll constraints, and session management
 */
export function EmbedChatInterface({ config, apiUrl }: EmbedChatInterfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  // Debug: Log config to see what designType we're getting
  useEffect(() => {
    console.log('[EmbedChatInterface] Config received:', {
      designType: config.designType,
      hasHeader: !!config.ui.headerText,
      hasFooter: !!config.ui.footerText,
      theme: config.theme
    });
  }, [config]);

  // Apply theme colors
  useEmbedTheme(config.theme);

  // Ensure proper embed layout
  useEmbedLayout();

  // Constrain scrolling to message container
  useEmbedScroll(messagesRef);

  // Get session ID
  const sessionId = useEmbedSession();

  // Initialize chat with session
  const {
    messages,
    sendStreamingMessage,
    initializeSession,
    selectOption,
    isLoading,
    isTyping,
  } = useChat(sessionId || "", config.chatbotConfigId);

  // Ensure session is created before interacting
  useEffect(() => {
    if (sessionId) {
      void initializeSession();
    }
  }, [sessionId, initializeSession]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim()) return;
    sendStreamingMessage(input);
    setInput("");
  };

  const handleOptionSelect = async (optionId: string, payload?: any, optionText?: string) => {
    if (!optionId) return;
    await selectOption(optionId, payload, optionText);
    await sendStreamingMessage(optionText || optionId);
  };

  const handleQuickReply = async (reply: string) => {
    if (!reply) return;
    await sendStreamingMessage(reply);
  };

  // Show loading state
  if (isLoading && !messages.length) {
    return (
      <div className="embed-chat-interface embed-loading">
        <div className="embed-loading-spinner">
          <Loader className="h-6 w-6 animate-spin" />
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  // Render the appropriate variant based on designType
  const variantProps = {
    messages,
    input,
    onInputChange: setInput,
    onSendMessage: handleSendMessage,
    onOptionSelect: handleOptionSelect,
    onQuickReply: handleQuickReply,
    isLoading,
    isTyping,
    config,
  };

  // Check if we're in embedded/iframe mode
  const isEmbedded = typeof window !== "undefined" && 
    (new URLSearchParams(window.location.search).get("embedded") === "true" ||
     (window as any).__EMBED_CONFIG__?.embedded === true);

  return (
    <div
      className="embed-chat-interface"
      ref={containerRef}
      data-design-type={config.designType}
      style={isEmbedded ? {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      } : undefined}
    >
      {config.designType === "minimal" && <MinimalEmbed {...variantProps} />}
      {config.designType === "compact" && <CompactEmbed {...variantProps} />}
      {config.designType === "full" && <FullEmbed {...variantProps} />}
    </div>
  );
}


