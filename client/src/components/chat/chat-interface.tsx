import { useState, useEffect, useRef } from "react";
import { Send, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MessageBubble from "./message-bubble";
import TypingIndicator from "./typing-indicator";
import { useChat } from "@/hooks/use-chat";
import { Message } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";
import { computeToneAdjustedColor, resolveThemeColors } from "./color-utils";

interface ChatInterfaceProps {
  sessionId: string;
  isMobile: boolean;
  isPreloaded?: boolean;
  chatbotConfig?: any;
}

export default function ChatInterface({ sessionId, isMobile, isPreloaded = false, chatbotConfig }: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingBubblesRef = useRef<any[]>([]);
  const queryClient = useQueryClient();

  const { 
    messages, 
    sendMessage,
    sendStreamingMessage, 
    selectOption, 
    isLoading,
    isSessionLoading 
  } = useChat(sessionId);

  const colors = resolveThemeColors(chatbotConfig);
  const inputBackground = computeToneAdjustedColor(
    colors.backgroundColor,
    colors.textColor,
    colors.botBubbleMode
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    streamingBubblesRef.current = [];

    try {
      await sendStreamingMessage(
        message,
        // onBubbleReceived: Add each complete bubble directly to main messages
        (message: Message) => {
          // Mark as follow-up if this isn't the first bubble in this streaming sequence
          const isFollowUp = streamingBubblesRef.current.length > 0;
          const bubbleWithFlag = {
            ...message,
            metadata: {
              ...(message.metadata && typeof message.metadata === 'object' ? message.metadata : {}),
              isFollowUp,
              isStreaming: false // Mark as permanent message
            }
          };

          // Add bubble directly to main messages query cache
          queryClient.setQueryData(['/api/chat', sessionId, 'messages'], (old: any) => {
            if (!old) return { messages: [bubbleWithFlag] };
            return { messages: [...old.messages, bubbleWithFlag] };
          });

          // Keep track of streaming bubbles for counting
          streamingBubblesRef.current.push(bubbleWithFlag);
        },
        // onAllComplete: Streaming finished, just set streaming state to false
        (messages: Message[]) => {
          setIsStreaming(false);
          // Clear the tracking ref since streaming is complete
          streamingBubblesRef.current = [];
        },
        // onError: Handle errors
        (error: string) => {
          setIsStreaming(false);
          streamingBubblesRef.current = [];
          console.error("Streaming error:", error);
        }
      );
    } catch (error) {
      setIsStreaming(false);
      streamingBubblesRef.current = [];
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleOptionSelect = async (optionId: string, payload?: any, optionText?: string) => {
    if (isLoading || isStreaming) return;


    try {
      // First, record the option selection in the backend (this updates survey sessions)
      await selectOption(optionId, payload, optionText);

      // Then trigger streaming response with the updated survey context
      const displayText = optionText || optionId;
      const contextMessage = `User selected option "${optionId}"` +
        (payload !== undefined && payload !== null ? ` with payload: ${JSON.stringify(payload)}` : '') +
        ". Provide a helpful response.";

      setIsStreaming(true);
      streamingBubblesRef.current = [];

      await sendStreamingMessage(
        displayText, // Send displayText as the actual message content
        // onBubbleReceived: Add each complete bubble directly to main messages
        (message: Message) => {
          // Mark as follow-up if this isn't the first bubble in this streaming sequence
          const isFollowUp = streamingBubblesRef.current.length > 0;
          const bubbleWithFlag = {
            ...message,
            metadata: {
              ...(message.metadata && typeof message.metadata === 'object' ? message.metadata : {}),
              isFollowUp,
              isStreaming: false // Mark as permanent message
            }
          };

          // Add bubble directly to main messages query cache
          queryClient.setQueryData(['/api/chat', sessionId, 'messages'], (old: any) => {
            if (!old) return { messages: [bubbleWithFlag] };
            return { messages: [...old.messages, bubbleWithFlag] };
          });

          // Keep track of streaming bubbles for counting
          streamingBubblesRef.current.push(bubbleWithFlag);
        },
        // onAllComplete: Streaming finished, just set streaming state to false
        (messages: Message[]) => {
          setIsStreaming(false);
          // Clear the tracking ref since streaming is complete
          streamingBubblesRef.current = [];
        },
        // onError: Handle errors
        (error: string) => {
          setIsStreaming(false);
          streamingBubblesRef.current = [];
          console.error("Option select streaming error:", error);
        },
        // Pass contextMessage as the internal message for AI processing
        contextMessage
      );
    } catch (error) {
      console.error("Option select error:", error);
    }
  };

  const handleQuickReply = async (reply: string) => {
    if (isLoading || isStreaming) return;

    setIsStreaming(true);
    streamingBubblesRef.current = [];

    try {
      await sendStreamingMessage(
        reply,
        // onBubbleReceived: Add each complete bubble directly to main messages
        (message: Message) => {
          // Mark as follow-up if this isn't the first bubble in this streaming sequence
          const isFollowUp = streamingBubblesRef.current.length > 0;
          const bubbleWithFlag = {
            ...message,
            metadata: {
              ...(message.metadata && typeof message.metadata === 'object' ? message.metadata : {}),
              isFollowUp,
              isStreaming: false // Mark as permanent message
            }
          };

          // Add bubble directly to main messages query cache
          queryClient.setQueryData(['/api/chat', sessionId, 'messages'], (old: any) => {
            if (!old) return { messages: [bubbleWithFlag] };
            return { messages: [...old.messages, bubbleWithFlag] };
          });

          // Keep track of streaming bubbles for counting
          streamingBubblesRef.current.push(bubbleWithFlag);
        },
        // onAllComplete: Streaming finished, just set streaming state to false
        (messages: Message[]) => {
          setIsStreaming(false);
          // Clear the tracking ref since streaming is complete
          streamingBubblesRef.current = [];
        },
        // onError: Handle errors
        (error: string) => {
          setIsStreaming(false);
          streamingBubblesRef.current = [];
          console.error("Quick reply streaming error:", error);
        }
      );
    } catch (error) {
      setIsStreaming(false);
      streamingBubblesRef.current = [];
    }
  };

  if (isSessionLoading && !isPreloaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onOptionSelect={handleOptionSelect}
            onQuickReply={handleQuickReply}
            chatbotConfig={chatbotConfig}
            sessionId={sessionId}
          />
        ))}

        {(isTyping || isStreaming) && <TypingIndicator chatbotConfig={chatbotConfig} />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border px-4 py-1 bg-background">
        <div className="flex items-center space-x-3">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Paperclip className="h-5 w-5" />
          </button>

          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="rounded-full pr-12 focus:ring-2 focus:border-transparent send-input"
              style={{
                backgroundColor: inputBackground,
                color: colors.textColor,
                borderColor: colors.textColor + '40',
                '--tw-ring-color': colors.primaryColor,
                fontSize: '14px'
              } as React.CSSProperties}
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
              className="send-button absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full h-8 w-8 p-0"
              style={{
                backgroundColor: colors.primaryColor,
                borderColor: colors.primaryColor,
                color: 'white'
              }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>


      </div>
    </>
  );
}