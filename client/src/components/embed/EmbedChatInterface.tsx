import { useRef, useEffect, useState, memo, useMemo, useCallback } from "react";
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

/**
 * EmbedChatInterfaceRenderer
 * 
 * Memoized render-only component that receives all props and data.
 * Does NOT call hooks - all data is passed in.
 * This prevents re-renders when internal hook state changes in parent.
 */
const EmbedChatInterfaceRenderer = memo(function EmbedChatInterfaceRenderer({
  config,
  apiUrl,
  messages,
  input,
  onInputChange,
  onSendMessage,
  onOptionSelect,
  onQuickReply,
  isLoading,
  isTyping,
  stage,
  onCTAPrimaryClick,
  onCTASecondaryClick,
  onCTAClose,
  ctaConfig,
  isEmbedded,
  messagesRef,
}: any) {
  if (stage === 'cta' && ctaConfig?.enabled) {
    return (
      <div
        className="embed-chat-interface embed-cta-stage"
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
          config={ctaConfig}
          onPrimaryButtonClick={onCTAPrimaryClick}
          onSecondaryButtonClick={onCTASecondaryClick}
          onClose={onCTAClose}
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
    onInputChange,
    onSendMessage,
    onOptionSelect,
    onQuickReply,
    isLoading,
    isTyping,
    config,
  };

  return (
    <div
      className="embed-chat-interface"
      ref={messagesRef}
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
}, (prevProps, nextProps) => {
  // Re-render only if key data actually changed
  return (
    prevProps.config === nextProps.config &&
    prevProps.apiUrl === nextProps.apiUrl &&
    prevProps.messages === nextProps.messages &&
    prevProps.input === nextProps.input &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.isTyping === nextProps.isTyping &&
    prevProps.stage === nextProps.stage
  );
});

EmbedChatInterfaceRenderer.displayName = 'EmbedChatInterfaceRenderer';

/**
 * EmbedChatInterface
 * 
 * Container component that manages chat logic and state.
 * Renders the memoized EmbedChatInterfaceRenderer with stable props.
 */
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

  // Debug: Log when messages change
  useEffect(() => {
    console.log('[EmbedChatInterface] Messages changed:', messages.length);
  }, [messages]);

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

  const handleSendMessage = useCallback(() => {
    if (!input.trim()) return;
    sendStreamingMessage(input);
    setInput("");
  }, [input, sendStreamingMessage]);

  const handleOptionSelect = useCallback((optionId: string, payload?: any, optionText?: string) => {
    if (!optionId) return;
    // Fire streaming immediately for instant visual feedback
    sendStreamingMessage(optionText || optionId);
    // Fire-and-forget: selectOption is only for backend tracking, not required for UI
    // Don't even use startTransition - just fire without awaiting
    selectOption(optionId, payload, optionText).catch(() => {
      // Silently ignore selection errors - streaming already handled the response
    });
  }, [sendStreamingMessage, selectOption]);

  const handleQuickReply = useCallback(async (reply: string) => {
    if (!reply) return;
    await sendStreamingMessage(reply);
  }, [sendStreamingMessage]);

  const handleCTAPrimaryClick = useCallback((message: string) => {
    transitionToChat(message);
  }, [transitionToChat]);

  const handleCTASecondaryClick = useCallback((message?: string) => {
    transitionToChat(message);
  }, [transitionToChat]);

  const handleCTAClose = useCallback(() => {
    transitionToChat();
  }, [transitionToChat]);

  const isEmbedded = typeof window !== "undefined" && 
    (new URLSearchParams(window.location.search).get("embedded") === "true" ||
     (window as any).__EMBED_CONFIG__?.embedded === true);

  // Return memoized renderer with all props
  return (
    <EmbedChatInterfaceRenderer
      config={config}
      apiUrl={apiUrl}
      messages={messages}
      input={input}
      onInputChange={setInput}
      onSendMessage={handleSendMessage}
      onOptionSelect={handleOptionSelect}
      onQuickReply={handleQuickReply}
      isLoading={isLoading}
      isTyping={isTyping}
      stage={stage}
      onCTAPrimaryClick={handleCTAPrimaryClick}
      onCTASecondaryClick={handleCTASecondaryClick}
      onCTAClose={handleCTAClose}
      ctaConfig={config.ctaConfig}
      isEmbedded={isEmbedded}
      messagesRef={messagesRef}
    />
  );
};
