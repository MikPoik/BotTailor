import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Minimize2, RefreshCw } from "lucide-react";
import TabbedChatInterface from "./tabbed-chat-interface";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChat } from "@/hooks/use-chat";

interface ChatWidgetProps {
  sessionId: string;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  chatbotConfig?: any;
}

export default function ChatWidget({ 
  sessionId: providedSessionId, 
  position = 'bottom-right',
  primaryColor = '#2563eb',
  backgroundColor = '#ffffff',
  textColor = '#1f2937',
  chatbotConfig
}: ChatWidgetProps) {
  const isClient = typeof window !== 'undefined';
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [initialMessages, setInitialMessages] = useState<string[]>([]);
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  // Reactive session ID state that can be updated on refresh
  const [currentSessionId, setCurrentSessionId] = useState(providedSessionId);
  const messageTimeouts = useRef<NodeJS.Timeout[]>([]);
  const queryClient = useQueryClient();

  // Generate a unique session ID for this chat widget instance
  const isMobile = useIsMobile();
  const injectedConfig = isClient ? (window as any).__CHAT_WIDGET_CONFIG__ : undefined;
  const isEmbedded = injectedConfig?.embedded || false;

  // Get chatbot config ID from injected config or props
  const chatbotConfigId = injectedConfig?.chatbotConfig?.id || chatbotConfig?.id;

  // Initialize chat data only when needed
  const { initializeSession, isSessionLoading, isMessagesLoading } = useChat(currentSessionId, chatbotConfigId);

  // Don't render widget if chatbot is inactive
  if (chatbotConfig && !chatbotConfig.isActive) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'bottom-2 right-2',
    'bottom-left': 'bottom-2 left-2'
  };

  // Resolve primary color for use in dynamic styles
  // In embedded mode, prioritize URL parameter color over chatbot config theme
  const resolvedPrimaryColor = isEmbedded 
    ? primaryColor || chatbotConfig?.theme?.chat?.primary
    : chatbotConfig?.theme?.chat?.primary || primaryColor;


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

  // Helper function to determine if a color is light or dark
  const isLightColor = (color: string): boolean => {
    // Ensure we have a valid color, default to white if not
    if (!color || !color.startsWith('#') || color.length !== 7) {
      return true; // Default to light if invalid color
    }

    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate luminance using the relative luminance formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5; // Return true if light, false if dark
  };

  // Inject CSS synchronously to prevent FOUC - memoized to prevent redundant operations
  useEffect(() => {
    const themeKey = `${resolvedPrimaryColor}-${backgroundColor}-${textColor}`;
    const currentThemeKey = document.documentElement.getAttribute('data-chat-theme-key');

    // Skip if same theme is already applied
    if (currentThemeKey === themeKey) {
      return;
    }

    const injectThemeStyles = () => {
      let existingStyle = document.getElementById('chat-widget-theme-styles');
      if (existingStyle) {
        existingStyle.remove();
      }

      const style = document.createElement('style');
      style.id = 'chat-widget-theme-styles';

      // Use brightness detection instead of strict color matching
      const isLightBackground = isLightColor(backgroundColor);


      style.textContent = `
        :root {
          --chat-primary: ${resolvedPrimaryColor};
          --chat-primary-color: ${resolvedPrimaryColor};
          --chat-background: ${backgroundColor};
          --chat-text: ${textColor};
        }

        /* Chat widget specific styling with complete theme */
        .chat-widget-container {
          --primary: ${resolvedPrimaryColor};
          --primary-foreground: white;
          --ring: ${resolvedPrimaryColor};
          --chat-bubble-bg: ${resolvedPrimaryColor};
          --chat-user-bg: ${resolvedPrimaryColor};
          --chat-hover: ${resolvedPrimaryColor};
          --background: ${backgroundColor};
          --foreground: ${textColor};
          --card: ${backgroundColor};
          --card-foreground: ${textColor};
          --popover: ${backgroundColor};
          --popover-foreground: ${textColor};
          --muted: ${isLightBackground ? '#f1f5f9' : '#2a2a2a'};
          --muted-foreground: ${isLightBackground ? '#64748b' : '#a1a1aa'};
          --border: ${isLightBackground ? '#e2e8f0' : '#404040'};
          --input: ${isLightBackground ? '#ffffff' : '#262626'};
          --accent: ${isLightBackground ? '#f1f5f9' : '#262626'};
          --accent-foreground: ${textColor};
        }

        /* Main chat interface background and text */
        .chat-widget-container .chat-interface,
        .chat-widget-container .chat-interface-mobile {
          background-color: ${backgroundColor} !important;
          color: ${textColor} !important;
        }

        /* Bot message bubbles - use white background - multiple selectors for embedded vs development */
        .chat-widget-container .chat-message-bot,
        .chat-message-bot {
          background-color: ${isLightBackground ? '#ffffff' : '#2a2a2a'} !important;
          color: ${textColor} !important;
          border-color: ${isLightBackground ? '#e2e8f0' : '#404040'} !important;
        }

        /* User message bubbles - multiple selectors for embedded vs development */
        .chat-widget-container .chat-message-user,
        .chat-message-user {
          background-color: ${resolvedPrimaryColor}cc !important;
          color: white !important;
        }

        /* Send button */
        .chat-widget-container button[type="submit"],
        .chat-widget-container .send-button {
          background-color: ${resolvedPrimaryColor} !important;
          border-color: ${resolvedPrimaryColor} !important;
          color: white !important;
        }

        /* All default variant buttons */
        .chat-widget-container .bg-primary {
          background-color: ${resolvedPrimaryColor} !important;
          color: white !important;
        }

        .chat-widget-container .hover\\:bg-primary\\/90:hover {
          background-color: ${resolvedPrimaryColor}e6 !important;
        }

        /* Primary buttons and interactive elements */
        .chat-widget-container .menu-option-button:hover {
          background-color: ${resolvedPrimaryColor} !important;
          color: white !important;
        }

        /* Input and form elements */
        .chat-widget-container input,
        .chat-widget-container textarea {
          background-color: ${isLightBackground ? '#ffffff' : '#262626'} !important;
          color: ${textColor} !important;
          border-color: ${isLightBackground ? '#e2e8f0' : '#404040'} !important;
        }

        /* Input focus ring */
        .chat-widget-container input:focus,
        .chat-widget-container textarea:focus,
        .chat-widget-container select:focus {
          --tw-ring-color: ${resolvedPrimaryColor} !important;
          border-color: ${resolvedPrimaryColor} !important;
          box-shadow: 0 0 0 2px ${resolvedPrimaryColor}40 !important;
        }

        /* Tab navigation background and text */
        .chat-widget-container [data-radix-tabs-list] {
          background: ${backgroundColor} !important;
          border-color: ${isLightBackground ? '#e2e8f0' : '#404040'} !important;
        }

        /* Tab navigation active state */
        .chat-widget-container [data-state="active"] {
          color: ${resolvedPrimaryColor} !important;
          border-bottom-color: ${resolvedPrimaryColor} !important;
        }

        /* Tabs trigger default state */
        .chat-widget-container [data-radix-tabs-trigger] {
          color: ${textColor} !important;
        }

        /* Tabs trigger active state */
        .chat-widget-container [data-radix-tabs-trigger][data-state="active"] {
          color: ${resolvedPrimaryColor} !important;
        }

        /* Card backgrounds */
        .chat-widget-container .bg-card {
          background-color: ${backgroundColor} !important;
          color: ${textColor} !important;
        }

        /* Quick reply buttons */
        .chat-widget-container .quick-reply-button {
          background-color: ${isLightBackground ? '#f1f5f9' : '#2a2a2a'} !important;
          color: ${textColor} !important;
          border-color: ${isLightBackground ? '#e2e8f0' : '#404040'} !important;
        }

        .chat-widget-container .quick-reply-button:hover {
          background-color: ${resolvedPrimaryColor} !important;
          color: white !important;
        }

        /* Progress indicators */
        .chat-widget-container .border-primary {
          border-color: ${resolvedPrimaryColor} !important;
        }

        /* Links */
        .chat-widget-container .text-primary {
          color: ${resolvedPrimaryColor} !important;
        }

        /* Interactive hover states */
        .chat-widget-container .hover\\:text-primary:hover {
          color: ${resolvedPrimaryColor} !important;
        }

        /* Form controls focus states */
        .chat-widget-container .focus-visible\\:ring-ring:focus-visible {
          --tw-ring-color: ${resolvedPrimaryColor} !important;
        }

        /* Selection and highlight states */
        .chat-widget-container ::selection {
          background-color: ${resolvedPrimaryColor}40 !important;
        }

        /* Embedded widget animations */
        .chat-widget-embedded {
          animation: chatWidgetEmbedOpen 0.6s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
        }

        .chat-widget-embedded.closing {
          animation: chatWidgetEmbedClose 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards !important;
        }

        @keyframes chatWidgetEmbedOpen {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes chatWidgetEmbedClose {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
        }

        /* Smooth transitions for all embedded elements */
        .chat-widget-embedded * {
          transition: all 0.2s ease !important;
        }
      `;
      document.head.appendChild(style);

      // Mark the current theme as applied
      document.documentElement.setAttribute('data-chat-theme-key', themeKey);
    };

    injectThemeStyles();

    return () => {
      // Only remove if we're unmounting completely, not just theme changes
      const existingStyle = document.getElementById('chat-widget-theme-styles');
      if (existingStyle && !document.documentElement.getAttribute('data-chat-theme-key')) {
        existingStyle.remove();
      }
    };
  }, [resolvedPrimaryColor, backgroundColor, textColor]);

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

  const refreshSession = () => {
    // Generate new session ID
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Update sessionStorage with new session ID
    const storageKey = isEmbedded ? 'embed-session-id' : 'global-chat-session-id';
    try {
      sessionStorage.setItem(storageKey, newSessionId);
      console.log(`[REFRESH] Generated new session ID: ${newSessionId}`);
    } catch (error) {
      console.warn('sessionStorage not accessible, session refresh may not persist');
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

    console.log(`[REFRESH] Chat history cleared, new session started: ${newSessionId}`);
  };


  // Initialize session for embedded chat when embedded mode is active and sessionId is available
  useEffect(() => {
    if (isEmbedded && currentSessionId) {
      initializeSession();
    }
  }, [isEmbedded, currentSessionId, initializeSession]);

  // Render different interfaces based on conditions but all at the end
  // Mobile full-screen interface
  if (isMobile && isOpen) {
    return (
      <>
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
          <div 
            className="text-white p-2 flex items-center justify-between flex-shrink-0"
            style={{ backgroundColor: resolvedPrimaryColor }}
          >
            <div className="flex items-center space-x-2">
              <img 
                src={chatbotConfig?.avatarUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256"} 
                alt={`${chatbotConfig?.name || 'Support agent'} avatar`} 
                className="w-10 h-10 rounded-full border-2 border-white"
              />

              <div>
                <h3 className="font-medium text-sm">{chatbotConfig?.name || 'Support Assistant'}</h3>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={refreshSession}
                className="text-white p-1.5 rounded transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${resolvedPrimaryColor}cc`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Start new conversation"
                data-testid="button-refresh-session"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button 
                onClick={closeChat}
                className="text-white p-1.5 rounded transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${resolvedPrimaryColor}cc`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                data-testid="button-close-chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chat content - takes remaining space */}
          <div className="flex-1 flex flex-col min-h-0">
            <TabbedChatInterface 
              sessionId={currentSessionId} 
              isMobile={true} 
              isPreloaded={!isSessionLoading && !isMessagesLoading}
              chatbotConfigId={chatbotConfigId}
              chatbotConfig={chatbotConfig}
              onSessionInitialize={initializeSession}
            />
          </div>
        </div>
      </>
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
      <div className="chat-widget-embedded">
        {/* Desktop header - sticky at top */}
        <div 
          className="chat-header text-white p-2 flex items-center justify-between"
          style={{ backgroundColor: resolvedPrimaryColor }}
        >
          <div className="flex items-center space-x-2">
            <img 
              src={chatbotConfig?.avatarUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256"} 
              alt={`${chatbotConfig?.name || 'Support agent'} avatar`} 
              className="w-10 h-10 rounded-full border-2 border-white"
            />

            <div>
              <h3 className="font-medium text-sm">{chatbotConfig?.name || 'Support Assistant'}</h3>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={refreshSession}
              className="text-white p-1.5 rounded transition-colors"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${resolvedPrimaryColor}cc`}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Start new conversation"
              data-testid="button-refresh-session"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button 
              onClick={handleEmbeddedClose}
              className="text-white p-1.5 rounded transition-colors"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${resolvedPrimaryColor}cc`}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              data-testid="button-minimize-chat"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Chat content - takes remaining space */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TabbedChatInterface 
            sessionId={currentSessionId} 
            isMobile={false} 
            isPreloaded={!isSessionLoading && !isMessagesLoading}
            isEmbedded={true}
            chatbotConfigId={chatbotConfigId}
            chatbotConfig={chatbotConfig}
          />
        </div>
      </div>
    );
  }


  // For non-embedded (development page), show floating widget
  return (
    <div className={`fixed ${positionClasses[position]} z-50 font-sans`}>
      {/* Chat Bubble */}
      {!isOpen && (
        <div className="relative">
          <button
            onClick={toggleChat}
            className="w-14 h-14 rounded-full shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center"
            style={{ backgroundColor: resolvedPrimaryColor, border: '1px solid white' }}
          >
            <MessageCircle className="w-5 h-5 text-white" />
          </button>

          {hasNewMessage && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">1</span>
            </div>
          )}
        </div>
      )}

      {/* Global close button for initial messages */}
      {!isOpen && visibleMessages.length > 0 && (
        <div
          className="absolute animate-fadeIn transition-all duration-300 flex justify-center"
          style={{
            [position === 'bottom-right' ? 'right' : 'left']: '0',
            bottom: `${65 + (visibleMessages.length * 50) + 20}px`,
            width: '100%',
            zIndex: 46,
          }}
        >
          <button
            onClick={() => {
              setVisibleMessages([]);
              // Mark messages as dismissed in sessionStorage
              const messagesHash = chatbotConfig?.id ? 
                `${chatbotConfig.id}_${initialMessages.join('|')}` : 
                initialMessages.join('|');
              const dismissedKey = `chat-initial-messages-dismissed-${messagesHash}`;
              safeSessionStorageForMessages.setItem(dismissedKey, 'true');
            }}
            className="bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-full p-2 shadow-lg border border-gray-200 transition-colors duration-200"
            title="Hide all messages"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Initial Message Bubbles */}
      {!isOpen && visibleMessages.map((messageIndex, bubbleIndex) => {
        const messageBottomOffset = 80 + (bubbleIndex * 55);
        const uniqueKey = `initial-message-${messageIndex}-${bubbleIndex}-${currentSessionId}`;
        return (
          <div
            key={uniqueKey}
            className="absolute animate-fadeIn transition-all duration-300"
            style={{
              [position === 'bottom-right' ? 'right' : 'left']: '0',
              bottom: `${messageBottomOffset}px`,
              maxWidth: '380px',
              minWidth: '280px',
              zIndex: 45
            }}
          >
            <div 
              className="bg-white rounded-2xl shadow-xl border border-gray-300 px-3 py-2 mx-0 my-2 relative cursor-pointer hover:shadow-2xl transition-shadow duration-200"
              onClick={() => {
                setIsOpen(true);
                setHasNewMessage(false);
                queryClient.invalidateQueries({ queryKey: ['/api/chat', currentSessionId, 'messages'] });
              }}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-gray-800 text-sm leading-relaxed font-normal">
                    {initialMessages[messageIndex]}
                  </p>
                </div>
              </div>

              {/* Arrow pointing to chat bubble */}
              <div 
                className="absolute w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45"
                style={{
                  [position === 'bottom-right' ? 'right' : 'left']: '24px',
                  bottom: '-8px',
                  right:'14px',
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Chat Interface */}
      {(isOpen || isClosing) && (
        <div className={`chat-widget-container bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-fadeIn ${
          isMobile 
            ? 'fixed inset-4 z-50' 
            : 'w-[550px]'
        }`} style={!isMobile ? { 
          height: '85vh', 
          maxHeight: '900px', 
          minHeight: '700px', 
          animation: isClosing 
            ? 'chatWidgetClose 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards' 
            : 'chatWidgetOpen 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)'
        } : {}}>
          {/* Chat header */}
          <div 
            className="text-white p-2 flex items-center justify-between flex-shrink-0"
            style={{ backgroundColor: resolvedPrimaryColor }}
          >
            <div className="flex items-center space-x-2">
              <img 
                src={chatbotConfig?.avatarUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256"} 
                alt={`${chatbotConfig?.name || 'Support agent'} avatar`} 
                className="w-10 h-10 rounded-full border-2 border-white"
              />

              <div>
                <h3 className="font-medium text-sm">{chatbotConfig?.name || 'Support Assistant'}</h3>
                {/*
                <div className="flex items-center space-x-1 text-xs text-blue-100">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span>Online</span>
                </div>
                */}
              </div>

            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={refreshSession}
                className="text-white p-1.5 rounded transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${resolvedPrimaryColor}cc`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Start new conversation"
                data-testid="button-refresh-session"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button 
                onClick={toggleChat}
                className="text-white p-1.5 rounded transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${resolvedPrimaryColor}cc`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                data-testid="button-minimize-chat"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chat content - takes remaining space */}
          <div className="flex-1 flex flex-col min-h-0">
            <TabbedChatInterface 
              sessionId={currentSessionId}
              isMobile={isMobile}
              isPreloaded={!isSessionLoading && !isMessagesLoading}
              chatbotConfigId={chatbotConfigId}
              chatbotConfig={chatbotConfig}
            />
          </div>
        </div>
      )}
    </div>
  );
}
