import { useState, useEffect, useRef } from "react";
import { Send, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MessageBubble from "./message-bubble";
import TypingIndicator from "./typing-indicator";
import { useChat } from "@/hooks/use-chat";
import { Message } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";

interface ChatInterfaceProps {
  sessionId: string;
  isMobile: boolean;
}

export default function ChatInterface({ sessionId, isMobile }: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [streamingBubbles, setStreamingBubbles] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { 
    messages, 
    sendMessage,
    sendStreamingMessage, 
    selectOption, 
    isLoading,
    isTyping,
    isSessionLoading 
  } = useChat(sessionId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingBubbles]);

  // Clear streaming bubbles only when we start a new message
  useEffect(() => {
    // Don't clear bubbles based on message matching since they're already saved to DB
    // They will be cleared when starting a new streaming sequence
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || isStreaming) return;

    const message = inputMessage.trim();
    setInputMessage("");
    setIsStreaming(true);
    setStreamingBubbles([]);

    try {
      await sendStreamingMessage(
        message,
        // onBubbleReceived: Show each complete bubble as it arrives
        (message: Message) => {
          setStreamingBubbles(prev => {
            // Mark as follow-up if this isn't the first bubble in this streaming sequence
            const isFollowUp = prev.length > 0;
            const bubbleWithFlag = {
              ...message,
              metadata: {
                ...message.metadata,
                isFollowUp,
                isStreaming: true // Mark as streaming to help with deduplication
              }
            };
            return [...prev, bubbleWithFlag];
          });
        },
        // onAllComplete: Streaming finished, keep bubbles visible and transition smoothly
        (messages: Message[]) => {
          setIsStreaming(false);
          // Mark streaming bubbles as completed instead of clearing them
          setStreamingBubbles(prev => 
            prev.map(bubble => ({
              ...bubble,
              metadata: {
                ...bubble.metadata,
                isStreaming: false,
                streamingComplete: true
              }
            }))
          );
          // Clear bubbles after a longer delay to allow natural message loading
          setTimeout(() => {
            setStreamingBubbles([]);
          }, 2000);
        },
        // onError: Handle errors
        (error: string) => {
          setIsStreaming(false);
          setStreamingBubbles([]);
          console.error("Streaming error:", error);
        }
      );
    } catch (error) {
      setIsStreaming(false);
      setStreamingBubbles([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleOptionSelect = async (optionId: string, payload?: any, optionText?: string) => {
    setIsTyping(true);
    try {
      await selectOption(optionId, payload, optionText);
      setIsTyping(false);
    } catch (error) {
      setIsTyping(false);
    }
  };

  const handleQuickReply = async (reply: string) => {
    setIsTyping(true);
    try {
      await sendMessage(reply);
      setIsTyping(false);
    } catch (error) {
      setIsTyping(false);
    }
  };

  if (isSessionLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onOptionSelect={handleOptionSelect}
            onQuickReply={handleQuickReply}
          />
        ))}

        {/* Show streaming bubbles as they arrive */}
        {streamingBubbles.map((bubble, index) => (
          <MessageBubble
            key={bubble.id}
            message={bubble}
            onOptionSelect={handleOptionSelect}
            onQuickReply={handleQuickReply}
          />
        ))}

        {(isTyping || isStreaming) && streamingBubbles.length === 0 && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-neutral-200 p-4 bg-white">
        <div className="flex items-center space-x-3">
          <button className="text-neutral-500 hover:text-neutral-700 transition-colors">
            <Paperclip className="h-5 w-5" />
          </button>

          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="rounded-full pr-12 border-neutral-300 focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full h-8 w-8 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick replies */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickReply("Thank you")}
            className="rounded-full text-xs px-3 py-1 h-auto"
            disabled={isLoading}
          >
            Thank you
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickReply("I need more help")}
            className="rounded-full text-xs px-3 py-1 h-auto"
            disabled={isLoading}
          >
            I need more help
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickReply("Contact human agent")}
            className="rounded-full text-xs px-3 py-1 h-auto"
            disabled={isLoading}
          >
            Contact agent
          </Button>
        </div>
      </div>
    </>
  );
}