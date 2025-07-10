import { formatDistanceToNow } from "date-fns";
import { Message } from "@shared/schema";
import { Button } from "@/components/ui/button";
import RichMessage from "./rich-message";

interface MessageBubbleProps {
  message: Message;
  onOptionSelect: (optionId: string, payload?: any, optionText?: string) => void;
  onQuickReply: (reply: string) => void;
}

export default function MessageBubble({ message, onOptionSelect, onQuickReply }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  const timeAgo = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });

  if (isUser) {
    return (
      <div className="flex justify-end animate-fadeIn">
        <div className="max-w-xs">
          <div className="chat-message-user">
            <p>{message.content}</p>
          </div>
          <span className="text-xs text-neutral-500 mt-1 block text-right">
            {timeAgo}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-3 animate-fadeIn">
      <img 
        src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256" 
        alt="Bot avatar" 
        className="w-8 h-8 rounded-full flex-shrink-0"
      />
      <div className="flex-1">
        {message.messageType === 'text' ? (
          <div className="chat-message-bot">
            <p className="text-neutral-800">{message.content}</p>
          </div>
        ) : (
          <RichMessage 
            message={message} 
            onOptionSelect={onOptionSelect}
            onQuickReply={onQuickReply}
          />
        )}

        {/* Quick replies for text messages */}
        {message.messageType === 'text' && message.metadata?.quickReplies && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.metadata.quickReplies.map((reply: string, index: number) => (
              <button
                key={index}
                onClick={() => onQuickReply(reply)}
                className="px-3 py-1 text-sm bg-neutral-100 text-neutral-700 rounded-full hover:bg-neutral-200 transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        <span className="text-xs text-neutral-500 mt-1 block">
          {timeAgo}
        </span>
      </div>
    </div>
  );
}