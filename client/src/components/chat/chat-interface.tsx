import { useState, useEffect, useRef } from "react";
import { Send, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MessageBubble from "./message-bubble";
import TypingIndicator from "./typing-indicator";
import { useChat } from "@/hooks/use-chat";
import { Message } from "@shared/schema";
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
    // Use requestAnimationFrame to ensure DOM is fully updated before scrolling
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, isTyping]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || isStreaming) return;

    const message = inputMessage.trim();
    setInputMessage("");
    setIsStreaming(true);

    try {
      await sendStreamingMessage(
        message,
        undefined, // No bubble callback - useChat handles cache
        () => setIsStreaming(false), // onComplete
        (error: string) => {
          setIsStreaming(false);
          console.error("Streaming error:", error);
        },
        undefined, // internalMessage
        false // skipOptimisticMessage - let useChat add user message
      );
    } catch (error) {
      setIsStreaming(false);
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

      await sendStreamingMessage(
        displayText,
        undefined, // No bubble callback - useChat handles cache  
        () => setIsStreaming(false), // onComplete
        (error: string) => {
          setIsStreaming(false);
          console.error("Option select streaming error:", error);
        },
        contextMessage, // Pass contextMessage as the internal message for AI processing
        true // skipOptimisticMessage - user message already shown via selectOption
      );
    } catch (error) {
      console.error("Option select error:", error);
    }
  };

  const handleQuickReply = async (reply: string) => {    if (isLoading || isStreaming) return;

    setIsStreaming(true);

    try {
      await sendStreamingMessage(
        reply,
        undefined, // No bubble callback - useChat handles cache
        () => setIsStreaming(false), // onComplete
        (error: string) => {
          setIsStreaming(false);
          console.error("Quick reply streaming error:", error);
        },
        undefined, // internalMessage
        false // skipOptimisticMessage - let useChat add user message
      );
    } catch (error) {
      setIsStreaming(false);
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
        {messages.map((message, idx) => {
          const prev = messages[idx - 1];
          // Treat both 'assistant' and 'bot' as assistant for legacy support
          const isAssistant = message.sender === 'assistant' || message.sender === 'bot';
          const prevIsAssistant = prev && (prev.sender === 'assistant' || prev.sender === 'bot');
          // Show avatar if this is an assistant message and either it's the first message, or the previous message is not assistant
          const showAvatar = isAssistant && (!prev || !prevIsAssistant);
          const next = messages[idx + 1];
          // Defensive: always treat metadata as object
          const nextMetadata = (next && typeof next.metadata === 'object' && next.metadata) ? next.metadata : {};
          // Show timestamp if this is the last in a contiguous group of same-sender and same-response messages
          const showTimestamp = !next || next.sender !== message.sender || !(nextMetadata as { isFollowUp?: boolean }).isFollowUp;
          // Only show timestamp for last assistant bubble in sequence
          const isLastInSequence = isAssistant && (!next || !(next.sender === 'assistant' || next.sender === 'bot') || !(nextMetadata as { isFollowUp?: boolean }).isFollowUp);
          return (
            <MessageBubble
              key={message.id}
              message={{ ...message, metadata: message.metadata || {} }}
              onOptionSelect={handleOptionSelect}
              onQuickReply={handleQuickReply}
              chatbotConfig={chatbotConfig}
              sessionId={sessionId}
              showAvatar={showAvatar}
              isLastInSequence={isLastInSequence}
              showTimestamp={showTimestamp}
            />
          );
        })}

        {(isTyping || isStreaming) && <TypingIndicator chatbotConfig={chatbotConfig} />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border px-4 py-1 bg-background">
        <div className="flex items-center space-x-3">
          <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
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
              type="button"
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