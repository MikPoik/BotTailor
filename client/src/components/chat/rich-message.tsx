import { memo } from "react";
import { Message } from "@shared/schema";
import { parseMarkdown } from "@/lib/markdown-utils";
import { CardMessage } from "./message-types/card-message";
import { MenuMessage } from "./message-types/menu-message";
import { MultiselectMessage } from "./message-types/multiselect-message";
import { RatingMessage } from "./message-types/rating-message";
import { FormMessage } from "./message-types/form-message";
import { 
  isCardMetadata, 
  isMenuMetadata, 
  isFormMetadata,
  MessageMetadata,
  CardMetadata,
  MenuMetadata,
  MultiselectMenuMetadata,
  RatingMetadata,
  FormMetadata,
  ImageMetadata,
  QuickRepliesMetadata
} from "@/types/message-metadata";

interface RichMessageProps {
  message: Message;
  onOptionSelect: (optionId: string, payload?: any, optionText?: string) => void;
  onQuickReply: (reply: string) => void;
  chatbotConfig?: any;
  sessionId?: string;
  themeColors?: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    messageBubbleBg: string;
  };
}

const RichMessage = memo(function RichMessage({ message, onOptionSelect, onQuickReply, chatbotConfig, sessionId, themeColors }: RichMessageProps) {
  const { messageType, content, metadata } = message;
  const typedMetadata = metadata as MessageMetadata;

  if (messageType === 'card' && isCardMetadata(typedMetadata)) {
    return (
      <CardMessage 
        content={content}
        metadata={typedMetadata as CardMetadata}
        onOptionSelect={onOptionSelect}
      />
    );
  }

  if (messageType === 'menu' && isMenuMetadata(typedMetadata)) {
    return (
      <MenuMessage 
        metadata={typedMetadata as MenuMetadata}
        onOptionSelect={onOptionSelect}
        themeColors={themeColors}
      />
    );
  }

  if (messageType === 'multiselect_menu' && isMenuMetadata(typedMetadata)) {
    return (
      <MultiselectMessage 
        metadata={typedMetadata as MultiselectMenuMetadata}
        onOptionSelect={onOptionSelect}
        themeColors={themeColors}
      />
    );
  }

  if (messageType === 'rating' && typedMetadata) {
    return (
      <RatingMessage 
        metadata={typedMetadata as RatingMetadata}
        onOptionSelect={onOptionSelect}
      />
    );
  }

  if (messageType === 'image' && (typedMetadata as ImageMetadata)?.imageUrl) {
    const imageMeta = typedMetadata as ImageMetadata;
    return (
      <div className="bg-white rounded-lg rounded-tl-none shadow-sm overflow-hidden border dark:bg-slate-800 dark:border-slate-700">
        <img 
          src={imageMeta.imageUrl} 
          alt={imageMeta.title || "Message image"} 
          className="w-full max-h-64 object-cover"
        />
        {content && (
          <div className="p-2">
            <p className="text-foreground">{content}</p>
          </div>
        )}
      </div>
    );
  }

  if (messageType === 'quickReplies' && (typedMetadata as QuickRepliesMetadata)?.quickReplies) {
    const quickMeta = typedMetadata as QuickRepliesMetadata;
    const defaultColors = {
      primaryColor: 'hsl(213, 93%, 54%)',
      backgroundColor: 'hsl(0, 0%, 100%)',
      textColor: 'hsl(20, 14.3%, 4.1%)',
      messageBubbleBg: 'hsl(0, 0%, 95%)'
    };
    const colors = themeColors || defaultColors;
    return (
      <div className="flex flex-wrap gap-2">
        {quickMeta.quickReplies.map((replyOption, index: number) => {
          const label = typeof replyOption === 'string' ? replyOption : replyOption.text;
          const value = typeof replyOption === 'string'
            ? replyOption
            : replyOption.action || replyOption.text;
          const isSkipOption = label.toLowerCase().includes('skip');
          return (
            <button
              key={`quickreply-${label}-${index}`}
              onClick={() => onQuickReply(value)}
              className="px-3 py-1 text-sm rounded-full transition-colors"
              style={{
                backgroundColor: colors.messageBubbleBg,
                color: colors.textColor,
                border: `1px solid ${colors.textColor}40`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.primaryColor;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.messageBubbleBg;
                e.currentTarget.style.color = colors.textColor;
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  if (messageType === 'form' && isFormMetadata(typedMetadata)) {
    return (
      <FormMessage 
        content={content}
        metadata={typedMetadata as FormMetadata}
        sessionId={sessionId || message.sessionId}
        messageId={message.id}
        chatbotConfig={chatbotConfig}
      />
    );
  }

  // Fallback to regular message
  return (
    <div className={`chat-message-bot ${(message.messageType === 'menu' || message.messageType === 'multiselect_menu' || message.messageType === 'rating' || message.messageType === 'quickReplies' || message.messageType === 'form' || message.messageType === 'table') ? 'no-background' : ''}`}>
      <p className="text-neutral-800">{content}</p>
    </div>
  );
});

export default RichMessage;
