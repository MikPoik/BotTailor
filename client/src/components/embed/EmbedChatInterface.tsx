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
  // Render counter
  const renderRef = useRef(0);
  renderRef.current += 1;
  console.debug('[EmbedChatInterfaceRenderer] render', { render: renderRef.current, stage, isEmbedded, ctaEnabled: !!ctaConfig?.enabled, messagesLen: messages?.length });

  // Log computed styles, inline style attribute and innerHTML snapshots for critical elements to detect visual changes outside React lifecycle
  const _lastStyleSnapshotRef = (useRef as any) as { current?: any };
  useEffect(() => {
    try {
      const embedEl = document.querySelector('.embed-chat-interface') as HTMLElement | null;
      const ctaEl = document.querySelector('.cta-view') as HTMLElement | null;

      const snapProps = (el: HTMLElement | null) => {
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          inlineStyle: el.getAttribute('style'),
          className: el.className,
          opacity: cs.opacity,
          transform: cs.transform,
          bgImage: cs.backgroundImage,
          bgColor: cs.backgroundColor,
          zIndex: cs.zIndex,
          visibility: cs.visibility,
          display: cs.display,
          rect: el.getBoundingClientRect(),
          htmlLen: el.innerHTML.length,
        };
      };

      const snapshot = {
        time: Date.now(),
        docClass: document.documentElement.className,
        bodyClass: document.body.className,
        embed: snapProps(embedEl),
        cta: snapProps(ctaEl),
        embedHTML: embedEl ? embedEl.innerHTML.slice(0, 300) : null,
        ctaHTML: ctaEl ? ctaEl.innerHTML.slice(0, 300) : null,
      };

      const prev = _lastStyleSnapshotRef.current;
      const styleDiffs: any = {};

      const comparePart = (key: string, a: any, b: any) => {
        if (JSON.stringify(a) !== JSON.stringify(b)) styleDiffs[key] = { prev: a, next: b };
      };

      if (prev) {
        comparePart('embed', prev.embed, snapshot.embed);
        comparePart('cta', prev.cta, snapshot.cta);
        if (prev.embedHTML !== snapshot.embedHTML || prev.ctaHTML !== snapshot.ctaHTML) {
          styleDiffs.html = { prevEmbedHTMLLen: prev.embed?.htmlLen, nextEmbedHTMLLen: snapshot.embed?.htmlLen, prevCtaHTMLLen: prev.cta?.htmlLen, nextCtaHTMLLen: snapshot.cta?.htmlLen };
        }

        if (Object.keys(styleDiffs).length > 0) {
          console.debug('[EmbedChatInterfaceRenderer] precise style/DOM diffs', styleDiffs);
          console.trace('[EmbedChatInterfaceRenderer] precise style/DOM change stack');
        }
      }

      // MutationObserver: watch for attribute/class/style changes on document root, body and embed element
      const observers: MutationObserver[] = [];
      const addObserver = (target: Node | null, opts: MutationObserverInit, name: string) => {
        if (!target) return;
        const observer = new MutationObserver((mutations) => {
          for (const m of mutations) {
            try {
              const changed = {
                type: m.type,
                target: (m.target as HTMLElement)?.id || (m.target as HTMLElement)?.className || m.target.nodeName,
                attributeName: m.attributeName,
                oldValue: m.oldValue,
              };
              console.debug(`[EmbedChatInterfaceRenderer][mutation:${name}]`, changed);
              console.trace(`[EmbedChatInterfaceRenderer][mutation:${name}] stack trace`);
            } catch (e) {
              console.debug('[EmbedChatInterfaceRenderer][mutation] error', e);
            }
          }
        });
        observer.observe(target as Node, opts);
        observers.push(observer);
      };

      addObserver(document.documentElement, { attributes: true, attributeOldValue: true }, 'documentElement');
      addObserver(document.body, { attributes: true, attributeOldValue: true }, 'body');
      addObserver(embedEl, { attributes: true, attributeOldValue: true, subtree: true, childList: true }, 'embed');

      // Listen for postMessage events from parent/host
      const onMessage = (ev: MessageEvent) => {
        console.debug('[EmbedChatInterfaceRenderer][message] received', { data: ev.data, origin: ev.origin });
        console.trace('[EmbedChatInterfaceRenderer][message] stack');
      };
      window.addEventListener('message', onMessage);

      _lastStyleSnapshotRef.current = snapshot;
      console.debug('[EmbedChatInterfaceRenderer] precise style snapshot', snapshot);

      return () => {
        observers.forEach(o => o.disconnect());
        window.removeEventListener('message', onMessage);
      };
    } catch (e) {
      console.debug('[EmbedChatInterfaceRenderer] style snapshot error', e);
    }
  });

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
          backgroundColor: config.theme?.backgroundColor || 'var(--embed-bg, #ffffff)'
        } : { backgroundColor: config.theme?.backgroundColor || 'var(--embed-bg, #ffffff)' }}
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
    console.debug('[EmbedChatInterfaceRenderer] props delta', {
      prev: { apiUrl: prevProps.apiUrl, messagesLen: prevProps.messages?.length, stage: prevProps.stage },
      next: { apiUrl: nextProps.apiUrl, messagesLen: nextProps.messages?.length, stage: nextProps.stage },
    });
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

  // Debug: render counter and lifecycle logging
  const _embedRenderCount = (useRef as any)?.current ? (useRef as any).current : null; // noop to keep lint happy
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  // Log minimal info to help trace re-renders
  console.debug("[EmbedChatInterface] render", {
    render: renderCountRef.current,
    embedId: config.embedId,
    designType: config.designType,
    stage,
    sessionId,
    messagesCount: Array.isArray((window as any).__TEST_MESSAGES__) ? (window as any).__TEST_MESSAGES__.length : undefined,
  });

  useEffect(() => {
    console.debug('[EmbedChatInterface] config changed', { embedId: config.embedId, ctaEnabled: !!config.ctaConfig?.enabled });
  }, [config.embedId, config.ctaConfig]);

  useEffect(() => {
    console.debug('[EmbedChatInterface] stage or session changed', { stage, sessionId });
  }, [stage, sessionId]);

  const {
    messages,
    sendStreamingMessage,
    initializeSession,
    selectOption,
    isLoading,
    isTyping,
  } = useChat(sessionId || "", config.chatbotConfigId);

  // Detailed re-render tracing: compare snapshot to previous render and trace stack
  const prevSnapshotRef = useRef<any>(null);
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
      const diffs: any = {};
      for (const k of Object.keys(snapshot)) {
        if (snapshot[k] !== prev[k]) diffs[k] = { prev: prev[k], next: snapshot[k] };
      }
      if (Object.keys(diffs).length > 0) {
        console.debug('[EmbedChatInterface] re-render snapshot diffs', diffs);
        console.trace('[EmbedChatInterface] re-render stack trace');
      } else {
        // No snapshot diffs found — render occurred without any of our tracked state/props changing
        console.debug('[EmbedChatInterface] render with NO snapshot diffs', { render: snapshot.render });
        console.trace('[EmbedChatInterface] unexpected re-render stack trace');
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

  // Use stable memoized config props to avoid child re-renders when parent re-renders
  const stableCTAConfig = useMemo(() => {
    try {
      return config.ctaConfig ? JSON.parse(JSON.stringify(config.ctaConfig)) : undefined;
    } catch (e) {
      return config.ctaConfig;
    }
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
