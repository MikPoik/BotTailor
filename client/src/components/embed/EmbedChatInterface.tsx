import { useRef, useEffect, useState } from "react";
import { useEmbedTheme, useEmbedLayout, useEmbedScroll, useEmbedSession } from "@/hooks/useEmbedConfig";
import { useEmbedStage } from "@/hooks/useEmbedStage";
import { useChat } from "@/hooks/use-chat";
import { MinimalEmbed } from "./embed-designs/MinimalEmbed";
import { CompactEmbed } from "./embed-designs/CompactEmbed";
import { FullEmbed } from "./embed-designs/FullEmbed";
import { CTAView } from "./embed-cta/CTAView";
import { Loader } from "lucide-react";
import { CTAConfig } from "@shared/schema";
import "./embed-chat-interface.css";

interface EmbedConfig {
  embedId?: string;
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
  ctaConfig?: CTAConfig;
}

interface EmbedChatInterfaceProps {
  config: EmbedConfig;
  apiUrl: string;
}

export function EmbedChatInterface({ config, apiUrl }: EmbedChatInterfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  useEffect(() => {
    console.log('[EmbedChatInterface] Config received:', {
      designType: config.designType,
      hasHeader: !!config.ui.headerText,
      hasFooter: !!config.ui.footerText,
      theme: config.theme,
      ctaEnabled: config.ctaConfig?.enabled
    });
  }, [config]);

  useEmbedTheme(config.theme);
  useEmbedLayout();
  useEmbedScroll(messagesRef);

  const sessionId = useEmbedSession();

  const { stage, transitionToChat, pendingMessage, clearPendingMessage } = useEmbedStage({
    embedId: config.embedId || 'default',
    ctaConfig: config.ctaConfig,
  });

  const {
    messages,
    sendStreamingMessage,
    initializeSession,
    selectOption,
    isLoading,
    isTyping,
  } = useChat(sessionId || "", config.chatbotConfigId);

  useEffect(() => {
    if (sessionId && stage === 'chat') {
      void initializeSession();
    }
  }, [sessionId, initializeSession, stage]);

  useEffect(() => {
    if (stage === 'chat' && pendingMessage && sessionId) {
      sendStreamingMessage(pendingMessage);
      clearPendingMessage();
    }
  }, [stage, pendingMessage, sessionId, sendStreamingMessage, clearPendingMessage]);

  useEffect(() => {
    if (messagesRef.current) {
      requestAnimationFrame(() => {
        if (messagesRef.current) {
          messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
      });
    }
  }, [messages, isTyping]);

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

  const handleCTAPrimaryClick = (message: string) => {
    transitionToChat(message);
  };

  const handleCTASecondaryClick = (message?: string) => {
    transitionToChat(message);
  };

  const handleCTAClose = () => {
    transitionToChat();
  };

  const isEmbedded = typeof window !== "undefined" && 
    (new URLSearchParams(window.location.search).get("embedded") === "true" ||
     (window as any).__EMBED_CONFIG__?.embedded === true);

  if (stage === 'cta' && config.ctaConfig?.enabled) {
    return (
      <div
        className="embed-chat-interface embed-cta-stage"
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
        <CTAView
          config={config.ctaConfig}
          onPrimaryButtonClick={handleCTAPrimaryClick}
          onSecondaryButtonClick={handleCTASecondaryClick}
          onClose={handleCTAClose}
          embedded={isEmbedded}
        />
      </div>
    );
  }

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
