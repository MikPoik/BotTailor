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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="embed-messages-container" ref={messagesRef}>
      {messages.length === 0 && !isLoading && (
        <div className="embed-empty-state">
          <p>Start a conversation</p>
        </div>
      )}

      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          onOptionSelect={onOptionSelect}
          onQuickReply={onQuickReply}
          chatbotConfig={config.chatbotConfig}
        />
      ))}

      {(isTyping) && (
        <TypingIndicator chatbotConfig={config.chatbotConfig} />
      )}
    </div>
  );
}
