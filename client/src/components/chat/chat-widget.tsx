import { useState, useEffect } from "react";
import { MessageCircle, X, Minimize2 } from "lucide-react";
import ChatInterface from "./chat-interface";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatWidgetProps {
  sessionId: string;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
}

export default function ChatWidget({ 
  sessionId, 
  position = 'bottom-right',
  primaryColor = '#2563eb' 
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const queryClient = useQueryClient();

  // Generate a unique session ID for this chat widget instance
  const isMobile = useIsMobile();

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
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessage(false);
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
            className="text-white p-4 flex items-center justify-between"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center space-x-3">
              <img 
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256" 
                alt="Support agent avatar" 
                className="w-10 h-10 rounded-full border-2 border-white"
              />
              <div>
                <h3 className="font-semibold">Support Assistant</h3>
                <div className="flex items-center space-x-1 text-xs text-blue-100">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Online</span>
                </div>
              </div>
            </div>
            <button 
              onClick={closeChat}
              className="text-white hover:bg-blue-600 p-2 rounded transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Chat content */}
          <ChatInterface sessionId={sessionId} isMobile={true} />
        </div>
      </>
    );
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 font-sans`}>
      {/* Chat bubble (minimized state) */}
      {!isOpen && (
        <div 
          className="chat-bubble relative"
          onClick={toggleChat}
          style={{ backgroundColor: primaryColor }}
        >
          <MessageCircle className="text-white h-6 w-6" />

          {/* Notification badge */}
          {hasNewMessage && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">1</span>
            </div>
          )}
        </div>
      )}

      {/* Chat interface (expanded state) */}
      {isOpen && !isMobile && (
        <div className="chat-interface">
          {/* Desktop header */}
          <div 
            className="text-white p-4 flex items-center justify-between"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center space-x-3">
              <img 
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256" 
                alt="Support agent avatar" 
                className="w-10 h-10 rounded-full border-2 border-white"
              />
              <div>
                <h3 className="font-semibold">Support Assistant</h3>
                <div className="flex items-center space-x-1 text-xs text-blue-100">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Online</span>
                </div>
              </div>
            </div>
            <button 
              onClick={toggleChat}
              className="text-white hover:bg-blue-600 p-2 rounded transition-colors"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>

          {/* Chat content */}
          <ChatInterface sessionId={sessionId} isMobile={false} />
        </div>
      )}
    </div>
  );
}