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
  chatbotConfig?: any;
}

export default function ChatWidget({ 
  sessionId, 
  position = 'bottom-right',
  primaryColor = '#2563eb',
  chatbotConfig
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const queryClient = useQueryClient();

  // Generate a unique session ID for this chat widget instance
  const isMobile = useIsMobile();
  const injectedConfig = (window as any).__CHAT_WIDGET_CONFIG__;
  const isEmbedded = injectedConfig?.embedded || false;

  // Preload chat data in background when widget mounts
  const { isSessionLoading, isMessagesLoading } = useChat(sessionId);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6'
  };

  useEffect(() => {
    // Custom CSS for theming
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --chat-primary: ${primaryColor};
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [primaryColor]);

  const toggleChat = () => {
    const wasOpen = isOpen;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessage(false);
      // Refetch messages when opening chat to sync with any new messages
      queryClient.invalidateQueries({ queryKey: ['/api/chat', sessionId, 'messages'] });
    }
  };

  const closeChat = () => {
    setIsOpen(false);
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
                className="w-7 h-7 rounded-full border-2 border-white"
              />
              <div>
                <h3 className="font-medium text-sm">{chatbotConfig?.name || 'Support Assistant'}</h3>
                <div className="flex items-center space-x-1 text-xs text-blue-100">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span>Online</span>
                </div>
              </div>
            </div>
            <button 
              onClick={closeChat}
              className="text-white hover:bg-blue-600 p-1.5 rounded transition-colors"
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
              className="w-7 h-7 rounded-full border-2 border-white"
            />
            <div>
              <h3 className="font-medium text-sm">{chatbotConfig?.name || 'Support Assistant'}</h3>
              <div className="flex items-center space-x-1 text-xs text-blue-100">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span>Online</span>
              </div>
            </div>
          </div>
          <button 
            onClick={handleEmbeddedClose}
            className="text-white hover:bg-blue-600 p-1.5 rounded transition-colors"
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

      {/* Chat Interface */}
      {isOpen && (
        <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden ${
          isMobile 
            ? 'fixed inset-4 z-50' 
            : 'w-[400px] h-[600px]'
        }`}>
          {/* Chat header */}
          <div 
            className="text-white p-3 flex items-center justify-between flex-shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center space-x-2">
              <img 
                src={chatbotConfig?.avatarUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256"} 
                alt={`${chatbotConfig?.name || 'Support agent'} avatar`} 
                className="w-7 h-7 rounded-full border-2 border-white"
              />
              <div>
                <h3 className="font-medium text-sm">{chatbotConfig?.name || 'Support Assistant'}</h3>
                <div className="flex items-center space-x-1 text-xs text-blue-100">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span>Online</span>
                </div>
              </div>
            </div>
            <button 
              onClick={toggleChat}
              className="text-white hover:bg-blue-600 p-1.5 rounded transition-colors"
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
              chatbotConfig={chatbotConfig}
            />
          </div>
        </div>
      )}
    </div>
  );
}