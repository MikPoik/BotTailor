import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { MessageCircle, MessageCircleMore , X, Minimize2, RefreshCw, HelpCircle } from "lucide-react";
import TabbedChatInterface from "./tabbed-chat-interface";
import AboutView from "./about-view";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient, useQuery } from "@tanstack/react-query";
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

interface ChatWidgetProps {
  sessionId: string; // Required - provided by Portal context
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
  const [isAnimatingOpen, setIsAnimatingOpen] = useState(false);

  // sessionId is required and provided by Portal context
  // Keep sessionId in state so we can reset the in-memory session without deleting DB records
  const [currentSessionId, setCurrentSessionId] = useState<string>(providedSessionId);
  
  const messageTimeouts = useRef<NodeJS.Timeout[]>([]);
  const renderedInitialMessages = useRef<Set<number>>(new Set());
  const queryClient = useQueryClient();

  // Fetch default chatbot config if not provided
  const { data: defaultChatbot } = useQuery({
    queryKey: ['/api/public/default-chatbot'],
    enabled: !chatbotConfig,
    retry: false,
  });

  const activeChatbotConfig = chatbotConfig || defaultChatbot;

  // Generate a unique session ID for this chat widget instance
  const isMobile = useIsMobile();
  const injectedConfig = isClient ? (window as any).__CHAT_WIDGET_CONFIG__ : undefined;
  const isEmbedded = injectedConfig?.embedded || false;

  // Get chatbot config ID from injected config or props
  const chatbotConfigId = injectedConfig?.chatbotConfig?.id || activeChatbotConfig?.id;

  // Memoize config to ensure stable reference for children
  const memoizedConfig = useMemo(() => activeChatbotConfig, [activeChatbotConfig?.id, activeChatbotConfig?.updatedAt]);

  // Avoid subscribing ChatWidget to chat queries; provide a lightweight initializer
  // that creates the session on the server (so it persists) without subscribing
  // to message queries in the widget itself.
  const initializeSession = useCallback(async () => {
    try {
      await apiRequest('POST', '/api/chat/session', {
        sessionId: currentSessionId,
        chatbotConfigId: chatbotConfigId || null,
      });

      // Ensure any cached session/messages for this id are refreshed
      queryClient.invalidateQueries({ queryKey: ['/api/chat', currentSessionId] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat', currentSessionId, 'messages'] });
    } catch (error) {
      console.error('[ChatWidget] initializeSession error', error);
    }
  }, [currentSessionId, chatbotConfigId, queryClient]);

  // Use a stable key so changing sessions won't unmount the UI subtree
  const chatInterfaceKey = 'chat-interface';

  // Don't render widget if chatbot is inactive
  if (activeChatbotConfig && !activeChatbotConfig.isActive) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'bottom-2 right-2',
    'bottom-left': 'bottom-2 left-2'
  };

  // Resolve theme colors - prioritize props, then chatbot config theme
  // Support both theme.chat.primary (old) and homeScreenConfig.theme.primaryColor (new)
  const resolvedPrimaryColor = primaryColor || 
    activeChatbotConfig?.homeScreenConfig?.theme?.primaryColor ||
    activeChatbotConfig?.theme?.primaryColor ||
    activeChatbotConfig?.theme?.chat?.primary ||
    '#2563eb';
  
  const resolvedBackgroundColor = backgroundColor ||
    activeChatbotConfig?.homeScreenConfig?.theme?.backgroundColor ||
    activeChatbotConfig?.theme?.backgroundColor ||
    activeChatbotConfig?.theme?.chat?.background ||
    '#ffffff';
    
  const resolvedTextColor = textColor ||
    activeChatbotConfig?.homeScreenConfig?.theme?.textColor ||
    activeChatbotConfig?.theme?.textColor ||
    activeChatbotConfig?.theme?.chat?.text ||
    '#1f2937';

  // Apply background/text color to document to avoid flash
  useApplyDocumentColors(resolvedBackgroundColor, resolvedTextColor, isClient);


  // Load initial messages from chatbot config
  useEffect(() => {
    if (activeChatbotConfig?.initialMessages && Array.isArray(activeChatbotConfig.initialMessages)) {
      const messages = activeChatbotConfig.initialMessages.map((msg: any) => 
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
      setIsAnimatingOpen(true);
      setHasNewMessage(false);
      // Initialize session and messages when chat opens for first time
      initializeSession();
      // Remove animation class after it completes to prevent re-triggering on re-renders
      setTimeout(() => setIsAnimatingOpen(false), 800);
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

  const refreshSession = async (reason: string = 'manual') => {
    // Generate a fresh server-backed session id
    const newId = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
      ? (crypto as any).randomUUID()
      : `session-${Math.random().toString(36).slice(2)}-${Date.now()}`;

    // Create the session on the server immediately so subsequent requests use it
    try {
      await apiRequest('POST', '/api/chat/session', {
        sessionId: newId,
        chatbotConfigId: chatbotConfigId || null,
      });
    } catch (e) {
      console.warn('[ChatWidget] refreshSession: failed to create server session', e);
    }

    // Clear caches and UI state for the previous session so the UI appears reset
    try {
      queryClient.removeQueries({ queryKey: ['/api/chat', currentSessionId, 'messages'] });
      queryClient.removeQueries({ queryKey: ['/api/chat', currentSessionId] });
    } catch (e) {
      console.warn('[ChatWidget] refreshSession: failed to remove old queries', e);
    }

    // Set the new session id that will be used for subsequent API calls
    setCurrentSessionId(newId);

    // Seed the messages cache for the new session with an empty array so children
    // render an empty conversation without needing an unmount/remount cycle.
    try {
      queryClient.setQueryData(['/api/chat', newId, 'messages'], { messages: [] });
    } catch (e) {
      // Non-fatal
    }

    // Reset local UI state without forcing a full subtree unmount
    setVisibleMessages([]);
    setInitialMessages([]);
    messageTimeouts.current.forEach((t) => clearTimeout(t));
    messageTimeouts.current = [];
    setHasNewMessage(false);
    setShowAbout(false);
    // Note: streaming cancellation is handled by the underlying hooks; avoid
    // forcibly unmounting the TabbedChatInterface so UX remains smooth.
  };


  // Ensure widget visibility - Simplified to remove manual DOM manipulation
  // and rely on React's state-driven rendering for the bubble and interface
  useEffect(() => {
    if (!isClient || isEmbedded) return;
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
        <div className={`fixed inset-0 z-50 bg-white flex flex-col transform-gpu will-change-transform ${
          isClosing 
            ? 'animate-slideDown' 
            : isAnimatingOpen ? 'animate-slideUp' : ''
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
                key={chatInterfaceKey}
                sessionId={currentSessionId} 
                isMobile={true} 
                isPreloaded={true}
                chatbotConfigId={chatbotConfigId}
                chatbotConfig={memoizedConfig}
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
              key={chatInterfaceKey}
              sessionId={currentSessionId} 
              isMobile={false} 
              isPreloaded={true}
              isEmbedded={true}
              chatbotConfigId={chatbotConfigId}
              chatbotConfig={memoizedConfig}
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
        <div className={`chat-widget-container bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden ${
          isMobile 
            ? 'fixed inset-4 z-50' 
            : 'w-[550px]'
        } ${isAnimatingOpen ? 'animate-fadeIn' : ''}`} style={!isMobile ? { 
          position: 'fixed',
          bottom: '20px',
          [position === 'bottom-right' ? 'right' : 'left']: '20px',
          height: 'clamp(600px, 90vh, 950px)', 
          maxHeight: '950px', 
          zIndex: 45,  /* Below cookie consent modal (z-50) */
          animation: isClosing 
            ? 'chatWidgetClose 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards' 
            : isAnimatingOpen ? 'chatWidgetOpen 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)' : 'none'
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
                key={chatInterfaceKey}
                sessionId={currentSessionId}
                isMobile={isMobile}
                isPreloaded={true}
                chatbotConfigId={chatbotConfigId}
                chatbotConfig={memoizedConfig}
                onSessionInitialize={initializeSession}
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
