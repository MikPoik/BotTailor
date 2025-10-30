import { memo } from "react";
import { formatDistanceToNow } from "date-fns";
import { Message } from "@shared/schema";
import { Button } from "@/components/ui/button";
import RichMessage from "./rich-message";
import StreamingMessage from "./streaming-message";
import { parseMarkdown } from "@/lib/markdown-utils";
import { isStreamingMetadata, MessageMetadata } from "@/types/message-metadata";

interface MessageBubbleProps {
  message: Message;
  onOptionSelect: (optionId: string, payload?: any, optionText?: string) => void;
  onQuickReply: (reply: string) => void;
  chatbotConfig?: any;
  sessionId?: string;
}

const MessageBubble = memo(function MessageBubble({ message, onOptionSelect, onQuickReply, chatbotConfig, sessionId }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  
  // Format timestamp as HH:MM
  const getTimestamp = (dateString: string | undefined) => {
    if (!dateString) return '';
    const messageDate = new Date(dateString);
    if (isNaN(messageDate.getTime())) return '';
    
    const hours = messageDate.getHours().toString().padStart(2, '0');
    const minutes = messageDate.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  const timeAgo = getTimestamp(
    (typeof message.createdAt === 'string' ? message.createdAt : message.createdAt?.toISOString?.())
  );
  if (isUser) {
    return (
      <div className="flex justify-end animate-fadeIn">
        <div className="max-w-xs">
          <div className="chat-message-user">
            <p dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }} />
          </div>
          {!(message.metadata as MessageMetadata)?.isFollowUp && timeAgo && (
            <span className="text-xs text-neutral-500 mt-1 block text-right">
              {timeAgo}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-3 animate-fadeIn">
      {/* Avatar space - only show avatar for first bubble in a sequence */}
      <div className="w-8 h-8 flex-shrink-0">
        {!(message.metadata as MessageMetadata)?.isFollowUp && (
          <img 
            src={chatbotConfig?.avatarUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256"} 
            alt="Bot avatar" 
            className="w-8 h-8 rounded-full"
          />
        )}
      </div>
      <div className="flex-1">
        {/* Check if this is a streaming/multipart message */}
        {isStreamingMetadata(message.metadata) ? (
          <StreamingMessage 
            message={message} 
            onOptionSelect={onOptionSelect}
            onQuickReply={onQuickReply}
            chatbotConfig={chatbotConfig}
            sessionId={sessionId}
          />
        ) : message.messageType === 'text' ? (
          <div className="chat-message-bot">
            <p 
              className="text-neutral-800" 
              dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
            />
          </div>
        ) : (
          <RichMessage 
            message={message} 
            onOptionSelect={onOptionSelect}
            onQuickReply={onQuickReply}
            chatbotConfig={chatbotConfig}
            sessionId={sessionId}
          />
        )}

        {/* Quick replies for text messages (only for non-streaming) */}
        {!isStreamingMetadata(message.metadata) && message.messageType === 'text' && (message.metadata as MessageMetadata)?.quickReplies && (
          <div className="flex flex-wrap gap-2 mt-2 pl-0">
            {(message.metadata as MessageMetadata).quickReplies!.map((reply: string | {text: string, action?: string}, index: number) => {
              const replyText = typeof reply === 'string' ? reply : reply.text;
              const replyAction = typeof reply === 'object' ? reply.action : undefined;
              
              return (
                <button
                  key={`msg-quickreply-${message.id}-${replyText}-${index}`}
                  onClick={() => {
                    if (replyAction === 'skip_question') {
                      // Handle skip with metadata
                      onQuickReply(JSON.stringify({
                        content: replyText,
                        metadata: { action: 'skip_question' }
                      }));
                    } else {
                      // Handle regular quick reply
                      onQuickReply(replyText);
                    }
                  }}
                  className="px-3 py-1 text-sm bg-neutral-100 text-neutral-700 rounded-full hover:bg-neutral-200 transition-colors"
                >
                  {replyText}
                </button>
              );
            })}
          </div>
        )}

        {/* Timestamp (only for non-streaming messages) */}
        {!isStreamingMetadata(message.metadata) && !(message.metadata as MessageMetadata)?.isFollowUp && timeAgo && (
          <span className="text-xs text-neutral-500 mt-1 block">
            {timeAgo}
          </span>
        )}
      </div>
    </div>
  );
});

export default MessageBubble;