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
  // Local ref for the root container to avoid constantly changing inline styles
  const containerRefLocal = useRef<HTMLElement | null>(null);
  // Track previously applied inline style values to avoid DOM churn
  const prevInlineStyleRef = useRef<string | null>(null);
  const prevStyleKeysRef = useRef<string[] | null>(null);

  // Keep a ref to store original inline styles when forcing CTA to full-viewport
  const _ctaOriginalStyleRef = useRef<Record<string, string> | null>(null);

  // Ensure CTA fills the iframe by applying a one-time style mutation when CTA stage is active.
  // This effect must be declared unconditionally to avoid hook order mismatches when stage toggles.
  useEffect(() => {
    if (!(stage === 'cta' && ctaConfig?.enabled)) return;

    const el = containerRefLocal.current;
    if (!el) return;

    // Save originals into the ref so cleanup can restore them
    _ctaOriginalStyleRef.current = {
      position: el.style.position,
      top: el.style.top,
      left: el.style.left,
      right: el.style.right,
      bottom: el.style.bottom,
      zIndex: el.style.zIndex,
      display: el.style.display,
      visibility: el.style.visibility,
      opacity: el.style.opacity,
    };

    try {
      if (isEmbedded) {
        el.style.setProperty('position', 'fixed');
        el.style.setProperty('top', '0');
        el.style.setProperty('left', '0');
        el.style.setProperty('right', '0');
        el.style.setProperty('bottom', '0');
        el.style.setProperty('z-index', '9999');
        el.style.setProperty('display', 'block');
        el.style.setProperty('visibility', 'visible');
        el.style.setProperty('opacity', '1');
      }
    } catch (e) {
      // ignore
    }

    return () => {
      try {
        const original = _ctaOriginalStyleRef.current;
        if (!original) return;
        if (original.position) el.style.position = original.position; else el.style.removeProperty('position');
        if (original.top) el.style.top = original.top; else el.style.removeProperty('top');
        if (original.left) el.style.left = original.left; else el.style.removeProperty('left');
        if (original.right) el.style.right = original.right; else el.style.removeProperty('right');
        if (original.bottom) el.style.bottom = original.bottom; else el.style.removeProperty('bottom');
        if (original.zIndex) el.style.zIndex = original.zIndex; else el.style.removeProperty('z-index');
        if (original.display) el.style.display = original.display; else el.style.removeProperty('display');
        if (original.visibility) el.style.visibility = original.visibility; else el.style.removeProperty('visibility');
        if (original.opacity) el.style.opacity = original.opacity; else el.style.removeProperty('opacity');
      } catch (e) {}
    };
  }, [stage, isEmbedded, ctaConfig?.enabled]);

  if (stage === 'cta' && ctaConfig?.enabled) {
    return (
      <div
        className="embed-chat-interface embed-cta-stage"
        data-design-type={config.designType}
        ref={(el) => { containerRefLocal.current = el as HTMLElement; }}
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
      ref={(el) => { messagesRef.current = el as HTMLDivElement; containerRefLocal.current = el as HTMLElement; }}
      data-design-type={config.designType}
    >
      {config.designType === "minimal" && <MinimalEmbed {...variantProps} />}
      {config.designType === "compact" && <CompactEmbed {...variantProps} />}
      {config.designType === "full" && <FullEmbed {...variantProps} />}
    </div>
  );
}, (prevProps, nextProps) => {
  // Re-render only if key data actually changed
  const equal = (
    prevProps.config === nextProps.config &&
    prevProps.apiUrl === nextProps.apiUrl &&
    prevProps.messages === nextProps.messages &&
    prevProps.input === nextProps.input &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.isTyping === nextProps.isTyping &&
    prevProps.stage === nextProps.stage
  );
  if (!equal) {
    // Props changed — re-render is expected when key props differ.
  }
  return equal;
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
  // Refs for minimal DOM-style updates to avoid repaint flashes (parent scope)
  const prevInlineStyleRef = useRef<string | null>(null);
  const prevStyleKeysRef = useRef<string[] | null>(null);
  const [input, setInput] = useState("");

  useEffect(() => {
    // ...existing code...
  }, [config]);

  useEmbedTheme(config.theme);
  useEmbedLayout();
  useEmbedScroll(messagesRef);

  const sessionId = useEmbedSession();

  const { stage, transitionToChat, pendingMessage, clearPendingMessage } = useEmbedStage({
    embedId: config.embedId || 'default',
    ctaConfig: config.ctaConfig,
  });

  // Render counter (kept for internal metrics if needed)
  const _embedRenderCount = (useRef as any)?.current ? (useRef as any).current : null; // noop to keep lint happy
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  useEffect(() => {
    // config changed
  }, [config.embedId, config.ctaConfig]);

  useEffect(() => {
    // stage or session changed
  }, [stage, sessionId]);

  const shouldInitChat = stage === 'chat';
  const {
    messages,
    sendStreamingMessage,
    initializeSession,
    selectOption,
    isLoading,
    isTyping,
  } = useChat(shouldInitChat ? (sessionId || "") : "", shouldInitChat ? config.chatbotConfigId : undefined);

  // Detailed re-render tracing: compare snapshot to previous render and trace stack
  const prevSnapshotRef = useRef<Record<string, any> | null>(null);
  useEffect(() => {
    const snapshot = {
      render: renderCountRef.current,
      sessionId,
      stage,
      messagesLen: messages?.length ?? 0,
      isLoading,
      isTyping,
      input,
      configId: config?.embedId,
      ctaEnabled: !!config?.ctaConfig?.enabled,
      configIdentity: config,
      ctaIdentity: config?.ctaConfig,
      time: Date.now(),
    };

    const prev = prevSnapshotRef.current;
    if (prev) {
      const diffs: Record<string, { prev: any; next: any }> = {};
      for (const k of Object.keys(snapshot) as Array<keyof typeof snapshot>) {
        if (snapshot[k] !== prev[k]) diffs[String(k)] = { prev: prev[k], next: snapshot[k] };
      }
      if (Object.keys(diffs).length > 0) {
        // Snapshot diffs detected — handled silently.
      } else {
        // Unexpected re-render without tracked diffs — no verbose logging.
      }
    }

    prevSnapshotRef.current = snapshot;
  }, [messages, isLoading, isTyping, input, sessionId, stage, config]);

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

  // Use stable memoized config props to avoid child re-renders
  const stableCTAConfig = useMemo(() => {
    return config.ctaConfig;
  }, [config.ctaConfig]);

  const stableConfig = useMemo(() => ({
    embedId: config.embedId,
    designType: config.designType,
    theme: config.theme,
    ui: config.ui,
    components: config.components,
    chatbotConfigId: config.chatbotConfigId,
    ctaConfig: stableCTAConfig,
  }), [config.embedId, config.designType, config.theme, config.ui, config.components, config.chatbotConfigId, stableCTAConfig]);

  // Apply minimal DOM-style updates only when necessary to avoid repaint flashes
  useEffect(() => {
    const el = (messagesRef.current as HTMLElement | null) || (containerRef.current as HTMLElement | null);
    if (!el) return;

    const desired: Record<string, string> = {};

    if (stage === 'cta' && stableCTAConfig?.enabled) {
      if (isEmbedded) {
        desired.position = 'fixed';
        desired.top = '0';
        desired.left = '0';
        desired.right = '0';
        desired.bottom = '0';
        desired.zIndex = '9999';
      }
      if (stableCTAConfig?.theme?.backgroundColor) desired.backgroundColor = stableCTAConfig.theme.backgroundColor;
    } else if (isEmbedded) {
      desired.position = 'fixed';
      desired.top = '0';
      desired.left = '0';
      desired.right = '0';
      desired.bottom = '0';
      desired.zIndex = '9999';
    }

    const serialized = JSON.stringify(desired);
    if (prevInlineStyleRef.current === serialized) {
      // Still ensure CTA remains visible if active by applying strong inline priority
      if (stage === 'cta' && stableCTAConfig?.enabled) {
        try {
          el.style.setProperty('display', 'block');
          el.style.setProperty('visibility', 'visible');
          el.style.setProperty('opacity', '1');
        } catch (e) {}
      }
      return; // no-op if styles identical
    }

    // Remove previously set keys not present in desired
    const prevKeys = prevStyleKeysRef.current || [];
    const newKeys = Object.keys(desired);
    for (const k of prevKeys) {
      if (!newKeys.includes(k)) {
        try { 
          // Remove inline property
          (el.style as any)[k] = '';
          // Remove possible !important set previously
          el.style.removeProperty(k);
        } catch (e) {}
      }
    }

    // Apply new styles
    for (const k of newKeys) {
      try { (el.style as any)[k] = desired[k]; } catch (e) {}
    }

    // If we're in CTA stage, force visibility to avoid transient hide by React
    if (stage === 'cta' && stableCTAConfig?.enabled) {
      try {
        el.style.setProperty('display', 'block');
        el.style.setProperty('visibility', 'visible');
        el.style.setProperty('opacity', '1');
      } catch (e) {}
    }

    prevInlineStyleRef.current = serialized;
    prevStyleKeysRef.current = newKeys;
  }, [stage, isEmbedded, stableCTAConfig?.enabled, stableCTAConfig?.theme?.backgroundColor]);


  // Return memoized renderer with all props
  return (
    <EmbedChatInterfaceRenderer
      config={stableConfig}
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
      ctaConfig={stableCTAConfig}
      isEmbedded={isEmbedded}
      messagesRef={messagesRef}
    />
  );
};
