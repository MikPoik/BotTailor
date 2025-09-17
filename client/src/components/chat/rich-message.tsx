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
}

const RichMessage = memo(function RichMessage({ message, onOptionSelect, onQuickReply, chatbotConfig, sessionId }: RichMessageProps) {
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
    console.log('[RICH MESSAGE] Menu message detected, full metadata:', typedMetadata);
    console.log('[RICH MESSAGE] Options in metadata:', typedMetadata.options);
    return (
      <MenuMessage 
        metadata={typedMetadata as MenuMetadata}
        onOptionSelect={onOptionSelect}
      />
    );
  }

  if (messageType === 'multiselect_menu' && isMenuMetadata(typedMetadata)) {
    return (
      <MultiselectMessage 
        metadata={typedMetadata as MultiselectMenuMetadata}
        onOptionSelect={onOptionSelect}
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
      <div className="bg-white rounded-lg rounded-tl-none shadow-sm overflow-hidden border">
        <img 
          src={imageMeta.imageUrl} 
          alt={imageMeta.title || "Message image"} 
          className="w-full max-h-64 object-cover"
        />
        {content && (
          <div className="p-2">
            <p className="text-neutral-800">{content}</p>
          </div>
        )}
      </div>
    );
  }

  if (messageType === 'quickReplies' && (typedMetadata as QuickRepliesMetadata)?.quickReplies) {
    const quickMeta = typedMetadata as QuickRepliesMetadata;
    return (
      <div className="flex flex-wrap gap-2">
        {quickMeta.quickReplies.map((reply: string, index: number) => {
          const isSkipOption = reply.toLowerCase().includes('skip');
          return (
            <button
              key={`quickreply-${reply}-${index}`}
              onClick={() => onQuickReply(reply)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                isSkipOption 
                  ? 'bg-neutral-200 text-neutral-600 border border-neutral-300 hover:bg-neutral-300' 
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {reply}
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