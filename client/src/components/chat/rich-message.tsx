import { Message } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface RichMessageProps {
  message: Message;
  onOptionSelect: (optionId: string, payload?: any) => void;
  onQuickReply: (reply: string) => void;
}

export default function RichMessage({ message, onOptionSelect, onQuickReply }: RichMessageProps) {
  const { messageType, content, metadata } = message;

  if (messageType === 'card' && metadata) {
    return (
      <div className="bg-white rounded-lg rounded-tl-none shadow-sm overflow-hidden border">
        {metadata.imageUrl && (
          <img 
            src={metadata.imageUrl} 
            alt={metadata.title || "Card image"} 
            className="w-full h-32 object-cover"
          />
        )}

        <div className="p-3">
          {metadata.title && (
            <h4 className="font-semibold text-neutral-800 mb-2">{metadata.title}</h4>
          )}

          {metadata.description && (
            <p className="text-sm text-neutral-600 mb-3">{metadata.description}</p>
          )}

          {content && content !== metadata.title && (
            <p className="text-neutral-800 mb-3">{content}</p>
          )}

          {metadata.buttons && (
            <div className="space-y-2">
              {metadata.buttons.map((button) => (
                <Button
                  key={button.id}
                  variant="outline"
                  size="sm"
                  onClick={() => onOptionSelect(button.id, button.payload, button.text)}
                  className="w-full justify-start text-left"
                >
                  {button.text}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (messageType === 'menu' && metadata?.options) {
    return (
      <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm border">
        <p className="text-neutral-800 mb-3">{content}</p>
        <div className="space-y-2">
          {metadata.options.map((option) => (
            <button
              key={option.id}
              onClick={() => onOptionSelect(option.id, option.payload, option.text)}
              className="w-full text-left p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center space-x-2"
            >
              {option.icon && (
                <i className={`${option.icon} text-primary`}></i>
              )}
              <span>{option.text}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (messageType === 'image' && metadata?.imageUrl) {
    return (
      <div className="bg-white rounded-lg rounded-tl-none shadow-sm overflow-hidden border">
        <img 
          src={metadata.imageUrl} 
          alt={metadata.title || "Message image"} 
          className="w-full max-h-64 object-cover"
        />
        {content && (
          <div className="p-3">
            <p className="text-neutral-800">{content}</p>
          </div>
        )}
      </div>
    );
  }

  if (messageType === 'quickReplies' && metadata?.quickReplies) {
    return (
      <div className="chat-message-bot">
        <p className="text-neutral-800 mb-3">{content}</p>
        <div className="flex flex-wrap gap-2">
          {metadata.quickReplies.map((reply: string, index: number) => (
            <button
              key={index}
              onClick={() => onQuickReply(reply)}
              className="px-3 py-1 text-sm bg-neutral-100 text-neutral-700 rounded-full hover:bg-neutral-200 transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Fallback to regular message
  return (
    <div className="chat-message-bot">
      <p className="text-neutral-800">{content}</p>
    </div>
  );
}