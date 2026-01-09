import React, { useState } from "react";
import { Message } from "@shared/schema";
import { EmbedMessages } from "../embed-components/EmbedMessages";
import { EmbedInput } from "../embed-components/EmbedInput";
import { EmbedWelcome } from "../embed-components/EmbedWelcome";

interface MinimalEmbedProps {
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
      inputPlaceholder: string;
      welcomeMessage?: string;
      showAvatar?: boolean;
      showTimestamp?: boolean;
      chatbotConfig?: any;
    };
  };
}

/**
 * Minimal Embed Design
 * Just chat - no header, footer, or extra UI elements
 * Best for: embedded in small spaces, sidebars, widgets
 */
export function MinimalEmbed({
  messages,
  input,
  onInputChange,
  onSendMessage,
  onOptionSelect,
  onQuickReply,
  isLoading,
  isTyping,
  config,
}: MinimalEmbedProps) {
  const [showWelcome, setShowWelcome] = useState(messages.length === 0);

  const handleWelcomeAction = () => {
    setShowWelcome(false);
  };

  return (
    <div 
      className="embed-design-minimal"
      style={{
        backgroundColor: config.theme.backgroundColor,
        color: config.theme.textColor,
      }}
    >
      <div className="embed-design-minimal-content">
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
