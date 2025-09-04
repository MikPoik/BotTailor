import { useState, useEffect } from "react";
import { MessageCircle, X, Minimize2 } from "lucide-react";
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
  sessionId, 
  position = 'bottom-right',
  primaryColor = '#2563eb',
  backgroundColor = '#ffffff',
  textColor = '#1f2937',
  chatbotConfig
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [initialMessages, setInitialMessages] = useState<string[]>([]);
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [messageTimeouts, setMessageTimeouts] = useState<NodeJS.Timeout[]>([]);
  const queryClient = useQueryClient();

  // Generate a unique session ID for this chat widget instance
  const isMobile = useIsMobile();
  const injectedConfig = (window as any).__CHAT_WIDGET_CONFIG__;
  const isEmbedded = injectedConfig?.embedded || false;

  // Get chatbot config ID from injected config or props
  const chatbotConfigId = injectedConfig?.chatbotConfig?.id || chatbotConfig?.id;

  // Preload chat data in background when widget mounts
  const { isSessionLoading, isMessagesLoading } = useChat(sessionId, chatbotConfigId);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6'
  };

  // Load initial messages from chatbot config
  useEffect(() => {
    if (chatbotConfig?.initialMessages && Array.isArray(chatbotConfig.initialMessages)) {
      const messages = chatbotConfig.initialMessages.map((msg: any) => 
        typeof msg === 'string' ? msg : msg.content || msg
      );
      setInitialMessages(messages);
    }
  }, [chatbotConfig]);

  // Show initial messages with staggered delays
  useEffect(() => {
    if (initialMessages.length > 0 && !isOpen && !isEmbedded) {
      const timeouts: NodeJS.Timeout[] = [];
      
      initialMessages.forEach((_, index) => {
        const timeout = setTimeout(() => {
          setVisibleMessages(prev => [...prev, index]);
          
          // Auto-hide after 8 seconds
          const hideTimeout = setTimeout(() => {
            setVisibleMessages(prev => prev.filter(i => i !== index));
          }, 8000);
          
          timeouts.push(hideTimeout);
        }, index * 2000); // Show each message 2 seconds apart
        
        timeouts.push(timeout);
      });
      
      setMessageTimeouts(timeouts);
      
      return () => {
        timeouts.forEach(timeout => clearTimeout(timeout));
      };
    }
  }, [initialMessages, isOpen, isEmbedded]);

  // Hide all initial messages when chat opens
  useEffect(() => {
    if (isOpen) {
      setVisibleMessages([]);
      messageTimeouts.forEach(timeout => clearTimeout(timeout));
      setMessageTimeouts([]);
    }
  }, [isOpen, messageTimeouts]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      messageTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [messageTimeouts]);

  useEffect(() => {
    // Custom CSS for theming
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --chat-primary: ${primaryColor};
        --chat-primary-color: ${primaryColor};
        --chat-background: ${backgroundColor};
        --chat-text: ${textColor};
      }
      
      /* Chat widget specific styling with complete theme */
      .chat-widget-container {
        --primary: ${primaryColor};
        --primary-foreground: white;
        --ring: ${primaryColor};
        --chat-bubble-bg: ${primaryColor};
        --chat-user-bg: ${primaryColor};
        --chat-hover: ${primaryColor};
        --background: ${backgroundColor};
        --foreground: ${textColor};
        --card: ${backgroundColor};
        --card-foreground: ${textColor};
        --popover: ${backgroundColor};
        --popover-foreground: ${textColor};
        --muted: ${backgroundColor === '#ffffff' ? '#f1f5f9' : '#2a2a2a'};
        --muted-foreground: ${textColor === '#1f2937' ? '#64748b' : '#a1a1aa'};
        --border: ${backgroundColor === '#ffffff' ? '#e2e8f0' : '#404040'};
        --input: ${backgroundColor === '#ffffff' ? '#ffffff' : '#262626'};
        --accent: ${backgroundColor === '#ffffff' ? '#f1f5f9' : '#262626'};
        --accent-foreground: ${textColor};
      }
      
      /* Main chat interface background and text */
      .chat-widget-container .chat-interface,
      .chat-widget-container .chat-interface-mobile {
        background-color: ${backgroundColor} !important;
        color: ${textColor} !important;
      }
      
      /* Bot message bubbles - use a contrasting color */
      .chat-widget-container .chat-message-bot {
        background-color: ${backgroundColor === '#ffffff' ? '#f1f5f9' : '#2a2a2a'} !important;
        color: ${textColor} !important;
        border-color: ${backgroundColor === '#ffffff' ? '#e2e8f0' : '#404040'} !important;
      }
      
      /* User message bubbles */
      .chat-widget-container .chat-message-user {
        background-color: ${primaryColor} !important;
        color: white !important;
      }
      
      /* Send button */
      .chat-widget-container button[type="submit"],
      .chat-widget-container .send-button {
        background-color: ${primaryColor} !important;
        border-color: ${primaryColor} !important;
        color: white !important;
      }
      
      /* All default variant buttons */
      .chat-widget-container .bg-primary {
        background-color: ${primaryColor} !important;
        color: white !important;
      }
      
      .chat-widget-container .hover\\:bg-primary\\/90:hover {
        background-color: ${primaryColor}e6 !important;
      }
      
      /* Primary buttons and interactive elements */
      .chat-widget-container .menu-option-button:hover {
        background-color: ${primaryColor} !important;
        color: white !important;
      }
      
      /* Input and form elements */
      .chat-widget-container input,
      .chat-widget-container textarea {
        background-color: ${backgroundColor === '#ffffff' ? '#ffffff' : '#262626'} !important;
        color: ${textColor} !important;
        border-color: ${backgroundColor === '#ffffff' ? '#e2e8f0' : '#404040'} !important;
      }
      
      /* Input focus ring */
      .chat-widget-container input:focus,
      .chat-widget-container textarea:focus,
      .chat-widget-container select:focus {
        --tw-ring-color: ${primaryColor} !important;
        border-color: ${primaryColor} !important;
        box-shadow: 0 0 0 2px ${primaryColor}40 !important;
      }
      
      /* Tab navigation background and text */
      .chat-widget-container [data-radix-tabs-list] {
        background: ${backgroundColor} !important;
        border-color: ${backgroundColor === '#ffffff' ? '#e2e8f0' : '#404040'} !important;
      }
      
      /* Tab navigation active state */
      .chat-widget-container [data-state="active"] {
        color: ${primaryColor} !important;
        border-bottom-color: ${primaryColor} !important;
      }
      
      /* Tabs trigger default state */
      .chat-widget-container [data-radix-tabs-trigger] {
        color: ${textColor} !important;
      }
      
      /* Tabs trigger active state */
      .chat-widget-container [data-radix-tabs-trigger][data-state="active"] {
        color: ${primaryColor} !important;
      }
      
      /* Card backgrounds */
      .chat-widget-container .bg-card {
        background-color: ${backgroundColor} !important;
        color: ${textColor} !important;
      }
      
      /* Quick reply buttons */
      .chat-widget-container .quick-reply-button {
        background-color: ${backgroundColor === '#ffffff' ? '#f1f5f9' : '#2a2a2a'} !important;
        color: ${textColor} !important;
        border-color: ${backgroundColor === '#ffffff' ? '#e2e8f0' : '#404040'} !important;
      }
      
      .chat-widget-container .quick-reply-button:hover {
        background-color: ${primaryColor} !important;
        color: white !important;
      }
      
      /* Progress indicators */
      .chat-widget-container .border-primary {
        border-color: ${primaryColor} !important;
      }
      
      /* Links */
      .chat-widget-container .text-primary {
        color: ${primaryColor} !important;
      }
      
      /* Interactive hover states */
      .chat-widget-container .hover\\:text-primary:hover {
        color: ${primaryColor} !important;
      }
      
      /* Form controls focus states */
      .chat-widget-container .focus-visible\\:ring-ring:focus-visible {
        --tw-ring-color: ${primaryColor} !important;
      }
      
      /* Selection and highlight states */
      .chat-widget-container ::selection {
        background-color: ${primaryColor}40 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [primaryColor, backgroundColor, textColor]);

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
      // Refetch messages when opening chat to sync with any new messages
      queryClient.invalidateQueries({ queryKey: ['/api/chat', sessionId, 'messages'] });
    }
  };

  const dismissMessage = (index: number) => {
    setVisibleMessages(prev => prev.filter(i => i !== index));
  };

  const closeChat = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 400); // Match animation duration
  };

  if (isMobile && isOpen) {
    return (
      <>
        {/* Mobile overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeChat}
        />

        {/* Mobile chat interface */}
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-slideUp">
          {/* Mobile header */}
          <div 
            className="text-white p-3 flex items-center justify-between flex-shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center space-x-2">
              <img 
                src={chatbotConfig?.avatarUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256"} 
                alt={`${chatbotConfig?.name || 'Support agent'} avatar`} 
                className="w10 h-10 rounded-full border-2 border-white"
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
            <button 
              onClick={closeChat}
              className="text-white p-1.5 rounded transition-colors"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}cc`}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Chat content - takes remaining space */}
          <div className="flex-1 flex flex-col min-h-0">
            <TabbedChatInterface 
              sessionId={sessionId} 
              isMobile={true} 
              isPreloaded={!isSessionLoading && !isMessagesLoading}
              chatbotConfigId={chatbotConfigId}
              chatbotConfig={chatbotConfig}
            />
          </div>
        </div>
      </>
    );
  }

  // If embedded (iframe), show the full chat interface
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
          className="chat-header text-white p-3 flex items-center justify-between"
          style={{ backgroundColor: primaryColor }}
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
          <button 
            onClick={handleEmbeddedClose}
            className="text-white p-1.5 rounded transition-colors"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}cc`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Chat content - takes remaining space */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TabbedChatInterface 
            sessionId={sessionId} 
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
            className="w-16 h-16 rounded-full shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center"
            style={{ backgroundColor: primaryColor }}
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </button>

          {hasNewMessage && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">1</span>
            </div>
          )}
        </div>
      )}

      {/* Initial Message Bubbles */}
      {!isOpen && visibleMessages.map((messageIndex) => {
        const messageBottomOffset = 90 + (visibleMessages.indexOf(messageIndex) * 80);
        return (
          <div
            key={messageIndex}
            className="absolute animate-fadeIn transition-all duration-300"
            style={{
              [position === 'bottom-right' ? 'right' : 'left']: '0',
              bottom: `${messageBottomOffset}px`,
              maxWidth: '350px',
              zIndex: 45
            }}
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 m-2 relative">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-gray-800 text-sm leading-relaxed">
                    {initialMessages[messageIndex]}
                  </p>
                </div>
                <button
                  onClick={() => dismissMessage(messageIndex)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Arrow pointing to chat bubble */}
              <div 
                className="absolute w-3 h-3 bg-white border-r border-b border-gray-200 transform rotate-45"
                style={{
                  [position === 'bottom-right' ? 'right' : 'left']: '20px',
                  bottom: '-6px'
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
            : 'w-[450px]'
        }`} style={!isMobile ? { 
          height: '75vh', 
          maxHeight: '800px', 
          minHeight: '600px', 
          animation: isClosing 
            ? 'chatWidgetClose 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards' 
            : 'chatWidgetOpen 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)'
        } : {}}>
          {/* Chat header */}
          <div 
            className="text-white p-3 flex items-center justify-between flex-shrink-0"
            style={{ backgroundColor: primaryColor }}
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
            <button 
              onClick={toggleChat}
              className="text-white p-1.5 rounded transition-colors"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}cc`}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>

          {/* Chat content - takes remaining space */}
          <div className="flex-1 flex flex-col min-h-0">
            <TabbedChatInterface 
              sessionId={sessionId} 
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