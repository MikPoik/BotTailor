import React, { useState } from "react";
import { Message } from "@shared/schema";
import { EmbedHeader } from "../embed-components/EmbedHeader";
import { EmbedMessages } from "../embed-components/EmbedMessages";
import { EmbedInput } from "../embed-components/EmbedInput";
import { EmbedWelcome } from "../embed-components/EmbedWelcome";

interface CompactEmbedProps {
  messages: Message[];
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onOptionSelect: (optionId: string, payload?: any, optionText?: string) => void;
  onQuickReply: (reply: string) => void;
  isLoading: boolean;
  isTyping: boolean;
  config: {
    theme: {
      primaryColor: string;
      backgroundColor: string;
      textColor: string;
    };
    ui: {
      headerText?: string;
      inputPlaceholder: string;
      welcomeMessage?: string;
      showAvatar?: boolean;
      showTimestamp?: boolean;
      chatbotConfig?: any;
    };
  };
}

/**
 * Compact Embed Design
 * Small header + chat + input
 * Best for: moderate-sized embeds, support widgets
 */
export function CompactEmbed({
  messages,
  input,
  onInputChange,
  onSendMessage,
  onOptionSelect,
  onQuickReply,
  isLoading,
  isTyping,
  config,
}: CompactEmbedProps) {
  const [showWelcome, setShowWelcome] = useState(messages.length === 0);

  const handleWelcomeAction = () => {
    setShowWelcome(false);
  };

  return (
    <div 
      className="embed-design-compact"
      style={{
        backgroundColor: config.theme.backgroundColor,
        color: config.theme.textColor,
      }}
    >
      {/* Header */}
      {config.ui.headerText && (
        <EmbedHeader
          title={config.ui.headerText}
          primaryColor={config.theme.primaryColor}
        />
      )}

      <div className="embed-design-compact-content">
        {/* Messages - welcome message will be first message from server */}
        <EmbedMessages
          messages={messages}
          isLoading={isLoading}
          isTyping={isTyping}
          config={{
            chatbotConfig: config.ui.chatbotConfig,
          }}
          onOptionSelect={onOptionSelect}
          onQuickReply={onQuickReply}
        />
      </div>

      {/* Input */}
      <EmbedInput
        value={input}
        onChange={onInputChange}
        onSend={onSendMessage}
        disabled={false}
        isLoading={isLoading}
        placeholder={config.ui.inputPlaceholder}
        primaryColor={config.theme.primaryColor}
      />
    </div>
  );
}
