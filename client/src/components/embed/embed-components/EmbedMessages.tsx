import React, { useRef, useEffect } from "react";
import { Message } from "@shared/schema";
import MessageBubble from "@/components/chat/message-bubble";
import TypingIndicator from "@/components/chat/typing-indicator";

interface EmbedMessagesProps {
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
  config: {
    chatbotConfig?: any;
  };
  onOptionSelect: (optionId: string, payload?: any, optionText?: string) => void;
  onQuickReply: (reply: string) => void;
}

export function EmbedMessages({ messages, isLoading, isTyping, config, onOptionSelect, onQuickReply }: EmbedMessagesProps) {
  const messagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or typing state changes
  useEffect(() => {
    if (messagesRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated before scrolling
      requestAnimationFrame(() => {
        if (messagesRef.current) {
          messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
      });
    }
  }, [messages, isTyping]);

  return (
    <div className="embed-messages-container" ref={messagesRef}>
      {messages.length === 0 && !isLoading && (
        <div className="embed-empty-state">
          <p>Start a conversation</p>
        </div>
      )}

      {messages.map((message, idx) => {
        const prev = messages[idx - 1];
        const next = messages[idx + 1];
        // Treat both 'assistant' and 'bot' as assistant for legacy support
        const isAssistant = message.sender === 'assistant' || message.sender === 'bot';
        const prevIsAssistant = prev && (prev.sender === 'assistant' || prev.sender === 'bot');
        const nextIsAssistant = next && (next.sender === 'assistant' || next.sender === 'bot');
        const showAvatar = isAssistant && (!prev || !prevIsAssistant);
        
        // Helper to check if two messages are in the same response sequence
        const isSameSequence = () => {
          if (!next || !nextIsAssistant) return false;
          // Check explicit isFollowUp flag first
          const nextMeta = (typeof next.metadata === 'object' && next.metadata) ? next.metadata : {};
          if ((nextMeta as any).isFollowUp === true) return true;
          // Fallback: check if timestamps are within 60 seconds (same response)
          const currentTime = message.createdAt ? new Date(message.createdAt).getTime() : 0;
          const nextTime = next.createdAt ? new Date(next.createdAt).getTime() : 0;
          if (currentTime && nextTime && Math.abs(nextTime - currentTime) < 60000) return true;
          return false;
        };
        
        // Only show timestamp for last assistant bubble in sequence
        const isLastInSequence = isAssistant && !isSameSequence();
        // For assistant messages: suppress timestamp during typing/streaming to avoid flash, only show after complete
        // For user messages: show if next is different sender
        const showTimestamp = isAssistant 
          ? (isLastInSequence && !isTyping) 
          : (!next || next.sender !== message.sender);
        return (
          <MessageBubble
            key={message.id}
            message={message}
            onOptionSelect={onOptionSelect}
            onQuickReply={onQuickReply}
            chatbotConfig={config.chatbotConfig}
            showAvatar={showAvatar}
            showTimestamp={showTimestamp}
            isLastInSequence={isLastInSequence}
          />
        );
      })}

      {(isTyping) && (
        <TypingIndicator chatbotConfig={config.chatbotConfig} />
      )}
    </div>
  );
}
