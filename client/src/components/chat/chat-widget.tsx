import { useState, useEffect, useRef, useCallback, memo } from "react";
import { MessageCircle, MessageCircleMore , X, Minimize2, RefreshCw, HelpCircle } from "lucide-react";
import TabbedChatInterface from "./tabbed-chat-interface";
import AboutView from "./about-view";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import WidgetHeader from "./widget/WidgetHeader";
import InitialMessageBubbles from "./widget/InitialMessageBubbles";
import FloatingBubble from "./widget/FloatingBubble";
import { useInjectChatTheme, useApplyDocumentColors, isLightColor } from "./widget/useWidgetTheme";
// import { useChat } from "@/hooks/use-chat";

const widgetDebug = () => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('chat_debug') === '1';
  } catch {
    return false;
  }
};

const debugLog = (...args: any[]) => {
  if (widgetDebug()) {
    console.log('[CHAT_DEBUG]', ...args);
  }
};

interface ChatWidgetProps {
  sessionId: string;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  chatbotConfig?: any;
}

function ChatWidget({ 
  sessionId: providedSessionId, 
  position = 'bottom-right',
  primaryColor = '#2563eb',
  backgroundColor = '#ffffff',
  textColor = '#1f2937',
  chatbotConfig
}: ChatWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headerTitleRef = useRef<HTMLHeadingElement | null>(null);
  const isClient = typeof window !== 'undefined';
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [initialMessages, setInitialMessages] = useState<string[]>([]);
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [showAbout, setShowAbout] = useState(false);
  // Reactive session ID state that can be updated on refresh
  const [currentSessionId, setCurrentSessionId] = useState(providedSessionId);
  
  const messageTimeouts = useRef<NodeJS.Timeout[]>([]);
  const renderedInitialMessages = useRef<Set<number>>(new Set());
  const queryClient = useQueryClient();

  // Generate a unique session ID for this chat widget instance
  const isMobile = useIsMobile();
  const injectedConfig = isClient ? (window as any).__CHAT_WIDGET_CONFIG__ : undefined;
  const isEmbedded = injectedConfig?.embedded || false;

  // Get chatbot config ID from injected config or props
  const chatbotConfigId = injectedConfig?.chatbotConfig?.id || chatbotConfig?.id;

  // Avoid subscribing ChatWidget to chat queries; initialization is handled in TabbedChatInterface
  const initializeSession = useCallback(() => {}, []);

  useEffect(() => {
    if (!widgetDebug()) return;
    debugLog('ChatWidget mount', { sessionId: currentSessionId, embedded: isEmbedded });
    const beforeUnload = () => debugLog('ChatWidget beforeunload');
    const unload = () => debugLog('ChatWidget unload');
    const visibility = () => debugLog('ChatWidget visibility', {
      state: document.visibilityState,
      hidden: document.hidden,
      time: Date.now()
    });
    const pageHide = (e: PageTransitionEvent) => debugLog('ChatWidget pagehide', { persisted: e.persisted });
    const pageShow = (e: PageTransitionEvent) => debugLog('ChatWidget pageshow', { persisted: e.persisted });
    const blur = () => debugLog('ChatWidget window blur');
    const focus = () => debugLog('ChatWidget window focus');
    window.addEventListener('pagehide', pageHide);
    window.addEventListener('pageshow', pageShow);
    window.addEventListener('blur', blur);
    window.addEventListener('focus', focus);
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('unload', unload);
    document.addEventListener('visibilitychange', visibility);

    // Observe container visibility/display changes to catch unexpected toggles
    let observer: MutationObserver | null = null;
    if (containerRef.current) {
      observer = new MutationObserver(() => {
        const el = containerRef.current;
        if (!el) return;
        const style = window.getComputedStyle(el);
        debugLog('ChatWidget container mutation', {
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity,
          className: el.className
        });
      });
      observer.observe(containerRef.current, { attributes: true, attributeFilter: ['style', 'class'] });
    }

    return () => {
      debugLog('ChatWidget unmount');
      window.removeEventListener('pagehide', pageHide);
      window.removeEventListener('pageshow', pageShow);
      window.removeEventListener('blur', blur);
      window.removeEventListener('focus', focus);
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('unload', unload);
      document.removeEventListener('visibilitychange', visibility);
      if (observer) observer.disconnect();
    };
  }, [currentSessionId, isEmbedded]);

  // Don't render widget if chatbot is inactive
  if (chatbotConfig && !chatbotConfig.isActive) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'bottom-2 right-2',
    'bottom-left': 'bottom-2 left-2'
  };

  // Resolve theme colors - prioritize props, then chatbot config theme
  // Support both theme.chat.primary (old) and homeScreenConfig.theme.primaryColor (new)
  const resolvedPrimaryColor = primaryColor || 
    chatbotConfig?.homeScreenConfig?.theme?.primaryColor ||
    chatbotConfig?.theme?.primaryColor ||
    chatbotConfig?.theme?.chat?.primary ||
    '#2563eb';
  
  const resolvedBackgroundColor = backgroundColor ||
    chatbotConfig?.homeScreenConfig?.theme?.backgroundColor ||
    chatbotConfig?.theme?.backgroundColor ||
    chatbotConfig?.theme?.chat?.background ||
    '#ffffff';
    
  const resolvedTextColor = textColor ||
    chatbotConfig?.homeScreenConfig?.theme?.textColor ||
    chatbotConfig?.theme?.textColor ||
    chatbotConfig?.theme?.chat?.text ||
    '#1f2937';

  // Apply background/text color to document to avoid flash
  useApplyDocumentColors(resolvedBackgroundColor, resolvedTextColor, isClient);


  // Load initial messages from chatbot config
  useEffect(() => {
    if (chatbotConfig?.initialMessages && Array.isArray(chatbotConfig.initialMessages)) {
      const messages = chatbotConfig.initialMessages.map((msg: any) => 
        typeof msg === 'string' ? msg : msg.content || msg
      );
      setInitialMessages(messages);
    }
  }, [chatbotConfig]);

  // Safe sessionStorage access for initial message persistence
  const safeSessionStorageForMessages = {
    getItem: (key: string): string | null => {
      if (isEmbedded) return null; // Skip sessionStorage in embedded mode
      try {
        if (typeof Storage === "undefined" || typeof sessionStorage === "undefined") {
          return null;
        }
        return sessionStorage.getItem(key);
      } catch (error) {
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      if (isEmbedded) return; // Skip sessionStorage in embedded mode
      try {
        if (typeof Storage === "undefined" || typeof sessionStorage === "undefined") {
          return;
        }
        sessionStorage.setItem(key, value);
      } catch (error) {
        // Fail silently
      }
    }
  };

  // Show initial messages with staggered delays until manually dismissed
  useEffect(() => {
    if (initialMessages.length > 0 && !isOpen && !isEmbedded) {
      // Create a unique cache key based on chatbot config and initial messages
      const messagesHash = chatbotConfig?.id ? 
        `${chatbotConfig.id}_${initialMessages.join('|')}` : 
        initialMessages.join('|');
      const dismissedKey = `chat-initial-messages-dismissed-${messagesHash}`;

      // Check if initial messages were manually dismissed (default is false/not dismissed)
      const areDismissed = safeSessionStorageForMessages.getItem(dismissedKey) === 'true';

      if (!areDismissed) {
        const timeouts: NodeJS.Timeout[] = [];

        initialMessages.forEach((_, index) => {
          const timeout = setTimeout(() => {
            setVisibleMessages(prev => [...prev, index]);
          }, index * 2000); // Show each message 2 seconds apart

          timeouts.push(timeout);
        });

        // Note: Removed auto-hide timeout - users must close messages manually

        // Mark initial messages as shown for this browser session, they will be dismissed on manual close
        // safeSessionStorage.setItem(messagesHash, 'true'); // This line was removed as it's no longer needed with the new logic.

        messageTimeouts.current = timeouts;

        return () => {
          timeouts.forEach(timeout => clearTimeout(timeout));
        };
      }
    }
  }, [initialMessages, isOpen, isEmbedded, chatbotConfig?.id]);

  // Hide all initial messages when chat opens
  useEffect(() => {
    if (isOpen) {
      setVisibleMessages([]);
      messageTimeouts.current.forEach(timeout => clearTimeout(timeout));
      messageTimeouts.current = [];
    }
  }, [isOpen]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      messageTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  useEffect(() => {
    if (visibleMessages.length === 0) {
      renderedInitialMessages.current.clear();
    }
  }, [visibleMessages.length]);

  // Compute header text color based on primary brightness
  const headerTextColor = isLightColor(resolvedPrimaryColor) ? '#1f2937' : '#ffffff';

  // Inject chat theme CSS and viewport fixes
  useInjectChatTheme(resolvedPrimaryColor, resolvedBackgroundColor, resolvedTextColor);

  const toggleChat = () => {
    if (isOpen) {
      // Start closing animation
      setIsClosing(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
      }, 400); // Match animation duration
    } else {
      setIsOpen(true);
      setHasNewMessage(false);
      // Initialize session and messages when chat opens for first time
      initializeSession();
    }
  };

  const dismissMessage = (index: number) => {
    setVisibleMessages(prev => prev.filter(i => i !== index));

    // If all messages are dismissed, mark them as dismissed in sessionStorage
    const remainingMessages = visibleMessages.filter(i => i !== index);
    if (remainingMessages.length === 0) {
      const messagesHash = chatbotConfig?.id ? 
        `${chatbotConfig.id}_${initialMessages.join('|')}` : 
        initialMessages.join('|'); // Corrected variable name here to initialInitialMessages
      const dismissedKey = `chat-initial-messages-dismissed-${messagesHash}`;
      safeSessionStorageForMessages.setItem(dismissedKey, 'true');
    }
  };

  const closeChat = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 400); // Match animation duration
  };

  const refreshSession = (reason: string = 'manual') => {
    // Generate new session ID
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Update sessionStorage with new session ID
    const storageKey = isEmbedded ? 'embed-session-id' : 'global-chat-session-id';
    try {
      sessionStorage.setItem(storageKey, newSessionId);
    } catch (error) {
      console.warn('sessionStorage not accessible, session refresh may not persist');
    }

    // If embedded, notify parent to update its embed session storage
    if (isEmbedded && typeof window !== 'undefined' && window.parent) {
      try {
        window.parent.postMessage({ type: 'RESET_SESSION', sessionId: newSessionId, reason }, '*');
      } catch {}
    }

    // Clear query cache for old session
    queryClient.invalidateQueries({ queryKey: ['/api/chat/session'] });
    queryClient.invalidateQueries({ queryKey: ['/api/chat', currentSessionId, 'messages'] });

    // Remove old session data to force fresh cache
    queryClient.removeQueries({ queryKey: ['/api/chat', currentSessionId] });

    // Update the current session ID state to trigger re-renders
    setCurrentSessionId(newSessionId);

    // Re-initialize the session with new ID
    if (initializeSession) {
      // Small delay to ensure state updates are processed
      setTimeout(() => {
        initializeSession();
      }, 100);
    }
  };


  // Ensure widget visibility - Refined to use React-safe approach and prevent layout thrashing
  useEffect(() => {
    if (!isClient || isEmbedded) return;
    
    // We've moved from a timeout to a direct style application on the containerRef
    // to ensure React stays in control of the element's lifecycle
    if (containerRef.current) {
      const el = containerRef.current;
      el.style.display = isOpen ? 'none' : 'block';
      el.style.visibility = 'visible';
      el.style.opacity = '1';
    }
  }, [isClient, isEmbedded, isOpen]);

  // Mobile full-screen interface
  if (isMobile && isOpen) {
    return (
      <div ref={containerRef} className="chat-widget-container">
        {/* Mobile overlay */}
        <div 
          className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${
            isClosing ? 'bg-opacity-0' : 'bg-opacity-50'
          }`}
          onClick={closeChat}
        />

        {/* Mobile chat interface */}
        <div className={`fixed inset-0 z-50 bg-white flex flex-col ${
          isClosing 
            ? 'animate-slideDown' 
            : 'animate-slideUp'
        }`}>
          {/* Mobile header */}
          <WidgetHeader
            primaryColor={resolvedPrimaryColor}
            title={chatbotConfig?.name || 'Support Assistant'}
            avatarUrl={chatbotConfig?.avatarUrl}
            onAbout={() => setShowAbout(true)}
            onRefresh={() => refreshSession('mobile-header-button')}
            onClose={closeChat}
            variant="mobile"
          />

          {/* Chat content - takes remaining space */}
          <div className="flex-1 flex flex-col min-h-0">
            {showAbout ? (
              <AboutView 
                onClose={() => setShowAbout(false)}
                primaryColor={resolvedPrimaryColor}
                backgroundColor={resolvedBackgroundColor}
                textColor={resolvedTextColor}
              />
            ) : (
              <TabbedChatInterface 
                key={`chat-${currentSessionId}`}
                sessionId={currentSessionId} 
                isMobile={true} 
                isPreloaded={true}
                chatbotConfigId={chatbotConfigId}
                chatbotConfig={chatbotConfig}
                onSessionInitialize={initializeSession}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Embedded iframe interface
  if (isEmbedded) {
    const handleEmbeddedClose = () => {
      // Send close message to parent window
      if (window.parent) {
        window.parent.postMessage({ type: 'CLOSE_CHAT' }, '*');
      }
    };

    return (
      <div 
        className="chat-widget-embedded chat-widget-container" 
        ref={containerRef}
        style={{
          // Force GPU acceleration and prevent repaint flash
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          willChange: 'contents',
          // Keep content visible during re-renders
          contentVisibility: 'visible',
          contain: 'layout style paint'
        }}
      >
        {/* Desktop header - sticky at top */}
        <WidgetHeader
          primaryColor={resolvedPrimaryColor}
          title={chatbotConfig?.name || 'Support Assistant'}
          avatarUrl={chatbotConfig?.avatarUrl}
          onAbout={() => setShowAbout(true)}
          onRefresh={() => refreshSession('embedded-header-button')}
          onClose={handleEmbeddedClose}
          variant="embedded"
        />

        {/* Chat content - takes remaining space */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {showAbout ? (
            <AboutView 
              onClose={() => setShowAbout(false)}
              primaryColor={resolvedPrimaryColor}
              backgroundColor={resolvedBackgroundColor}
              textColor={resolvedTextColor}
            />
          ) : (
            <TabbedChatInterface 
              key={`chat-${currentSessionId}`}
              sessionId={currentSessionId} 
              isMobile={false} 
              isPreloaded={true}
              isEmbedded={true}
              chatbotConfigId={chatbotConfigId}
              chatbotConfig={chatbotConfig}
            />
          )}
        </div>
      </div>
    );
  }


  // For non-embedded (development page), show floating widget
  return (
    <>
      {/* Chat Bubble and Initial Messages Container */}
      <div 
        className={`font-sans chat-widget-container`} 
        ref={containerRef} 
        style={{ 
          position: 'fixed',
          [position === 'bottom-right' ? 'right' : 'left']: '16px',
          bottom: '16px',
          zIndex: 40,
          pointerEvents: isOpen ? 'none' : 'auto',
          display: isOpen ? 'none' : 'block',
          width: '70px',
          height: '70px'
        }}
      >
        {/* Initial Message Bubbles - absolutely positioned above the bubble */}
        {visibleMessages.length > 0 && (
          <InitialMessageBubbles
            position={position}
            visibleMessages={visibleMessages}
            initialMessages={initialMessages}
            onDismissAll={() => {
              setVisibleMessages([]);
              const messagesHash = chatbotConfig?.id ? `${chatbotConfig.id}_${initialMessages.join('|')}` : initialMessages.join('|');
              const dismissedKey = `chat-initial-messages-dismissed-${messagesHash}`;
              safeSessionStorageForMessages.setItem(dismissedKey, 'true');
            }}
            onOpenChat={() => {
              setIsOpen(true);
              setHasNewMessage(false);
              queryClient.invalidateQueries({ queryKey: ['/api/chat', currentSessionId, 'messages'] });
            }}
          />
        )}

        {/* Chat Bubble */}
        <FloatingBubble
          color={resolvedPrimaryColor}
          onClick={toggleChat}
          hasNewMessage={hasNewMessage}
        />
      </div>

      {/* Chat Interface - Rendered as sibling to avoid nested fixed positioning */}
      {(isOpen || isClosing) && (
        <div className={`chat-widget-container bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-fadeIn ${
          isMobile 
            ? 'fixed inset-4 z-50' 
            : 'w-[550px]'
        }`} style={!isMobile ? { 
          position: 'fixed',
          bottom: '20px',
          [position === 'bottom-right' ? 'right' : 'left']: '20px',
          height: 'clamp(600px, 90vh, 950px)', 
          maxHeight: '950px', 
          zIndex: 45,  /* Below cookie consent modal (z-50) */
          animation: isClosing 
            ? 'chatWidgetClose 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards' 
            : 'chatWidgetOpen 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)'
        } : {}}>
          {/* Chat header */}
          <WidgetHeader
            primaryColor={resolvedPrimaryColor}
            title={chatbotConfig?.name || 'Support Assistant'}
            avatarUrl={chatbotConfig?.avatarUrl}
            onAbout={() => setShowAbout(true)}
            onRefresh={() => refreshSession('floating-header-button')}
            onClose={toggleChat}
            variant="floating"
          />

          {/* Chat content - takes remaining space */}
          <div className="flex-1 flex flex-col min-h-0">
            {showAbout ? (
              <AboutView 
                onClose={() => setShowAbout(false)}
                primaryColor={resolvedPrimaryColor}
                backgroundColor={resolvedBackgroundColor}
                textColor={resolvedTextColor}
              />
            ) : (
              <TabbedChatInterface 
                key={`chat-${currentSessionId}`}
                sessionId={currentSessionId}
                isMobile={isMobile}
                isPreloaded={true}
                chatbotConfigId={chatbotConfigId}
                chatbotConfig={chatbotConfig}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Prevent unnecessary re-renders by memoizing the component
// This stops the entire widget from re-rendering when React Query updates
export default memo(ChatWidget);
