import React, { useState } from "react";
import { Message } from "@shared/schema";
import { EmbedHeader } from "../embed-components/EmbedHeader";
import { EmbedFooter } from "../embed-components/EmbedFooter";
import { EmbedMessages } from "../embed-components/EmbedMessages";
import { EmbedInput } from "../embed-components/EmbedInput";
import { EmbedWelcome } from "../embed-components/EmbedWelcome";

interface FullEmbedProps {
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
      footerText?: string;
      inputPlaceholder: string;
      welcomeMessage?: string;
      showAvatar?: boolean;
      showTimestamp?: boolean;
      hideBranding?: boolean;
      chatbotConfig?: any;
    };
  };
}

/**
 * Full Embed Design
 * Header + chat + footer + input + branding
 * Best for: full-featured embeds, dedicated chat sections
 */
export function FullEmbed({
  messages,
  input,
  onInputChange,
  onSendMessage,
  onOptionSelect,
  onQuickReply,
  isLoading,
  isTyping,
  config,
}: FullEmbedProps) {
  const [showWelcome, setShowWelcome] = useState(messages.length === 0);

  const handleWelcomeAction = () => {
    setShowWelcome(false);
  };

  // ...existing code...

  return (
    <div 
      className="embed-design-full"
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

      <div className="embed-design-full-content">
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

      {/* Footer */}
      {(config.ui.footerText || !config.ui.hideBranding) && (
        <EmbedFooter
          text={config.ui.footerText}
          branding={!config.ui.hideBranding ? "Powered by BotTailor" : undefined}
          primaryColor={config.theme.primaryColor}
        />
      )}
    </div>
  );
}
