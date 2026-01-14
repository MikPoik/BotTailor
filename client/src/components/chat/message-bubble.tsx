import { memo, useEffect, useRef, useState } from "react";
import { Message } from "@shared/schema";
import RichMessage from "./rich-message";
import StreamingMessage from "./streaming-message";
import { parseMarkdown } from "@/lib/markdown-utils";
import { isStreamingMetadata, MessageMetadata } from "@/types/message-metadata";
import { computeToneAdjustedColor, resolveThemeColors } from "./color-utils";

// Color resolution function that prioritizes embed parameters over UI Designer theme
function resolveColors(chatbotConfig?: any) {
  const themeColors = resolveThemeColors(chatbotConfig);

  return {
    ...themeColors,
    messageBubbleBg: computeToneAdjustedColor(
      themeColors.backgroundColor,
      themeColors.textColor,
      themeColors.botBubbleMode
    )
  };
}

interface MessageBubbleProps {
  message: Message;
  onOptionSelect: (optionId: string, payload?: any, optionText?: string) => void;
  onQuickReply: (reply: string) => void;
  chatbotConfig?: any;
  sessionId?: string;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  isLastInSequence?: boolean; // Only show timestamp if true for assistant bubbles
}

const MessageBubble = memo(function MessageBubble({ message, onOptionSelect, onQuickReply, chatbotConfig, sessionId, showAvatar: showAvatarProp, showTimestamp, isLastInSequence }: MessageBubbleProps) {
  // Track which messages have already played their entrance animation
  const animatedMessageIds = useRef(new Set<string | number>());
  const [hasAnimated, setHasAnimated] = useState(false);
  
  // Treat both 'assistant' and 'bot' as assistant for legacy support
  const isAssistant = message.sender === 'assistant' || message.sender === 'bot';
  const isUser = message.sender === 'user';
  const colors = resolveColors(chatbotConfig);
  
  // Log mount/unmount and render
  useEffect(() => {
    // Mark message as animated on first render
    if (!animatedMessageIds.current.has(message.id)) {
      animatedMessageIds.current.add(message.id);
      setHasAnimated(true);
    }
    
    console.log('[MessageBubble] mounted/updated', {
      id: message.id,
      type: message.messageType,
      sender: message.sender,
      content: message.content?.slice(0, 50),
    });
    return () => {
      console.log('[MessageBubble] unmounted', { id: message.id });
    };
  }, [message.id]);
  
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
      <div className={`flex justify-end ${hasAnimated ? '' : 'animate-fadeIn'}`}>
        <div className="max-w-xs">
          <div className="chat-message-user">
            <p dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }} />
          </div>
          {showTimestamp && timeAgo && (
            <span className="text-xs text-neutral-500 mt-1 block text-right">
              {timeAgo}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start space-x-3 ${hasAnimated ? '' : 'animate-fadeIn'}`}>
      {/* Avatar space - only show avatar for first bubble in a sequence */}
      <div className="w-8 h-8 flex-shrink-0">
        {(() => {
          const showAvatar = typeof showAvatarProp === 'boolean'
            ? showAvatarProp
            : !((message.metadata as MessageMetadata)?.isFollowUp);

          return showAvatar ? (
            <img
              src={chatbotConfig?.avatarUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256"}
              alt="Bot avatar"
              className="w-8 h-8 rounded-full"
            />
          ) : null;
        })()}
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
            themeColors={colors}
          />
        ) : message.messageType === 'text' ? (
          <div 
            className="rounded-lg rounded-tl-none px-2 py-2 shadow-sm max-w-sm"
            style={{
              backgroundColor: colors.messageBubbleBg,
              color: colors.textColor,
              borderColor: colors.textColor + '20',
              borderWidth: '1px',
              borderStyle: 'solid',
              fontSize: '0.9rem'
            }}
          >
            <p 
              style={{ color: colors.textColor }}
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
            themeColors={colors}
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
                  type="button"
                  key={`msg-quickreply-${message.id}-${replyText}-${index}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
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
                  {replyText}
                </button>
              );
            })}
          </div>
        )}

        {/* Timestamp (only for non-streaming messages) */}
        {/* Timestamp (only for non-streaming messages, and only if last in sequence for assistant) */}
        {showTimestamp && !isStreamingMetadata(message.metadata) && timeAgo &&
          ((!isAssistant) || (isAssistant && isLastInSequence)) && (
            <span className="text-xs text-muted-foreground mt-1 block">
              {timeAgo}
            </span>
        )}
        {/*
          NOTE: For correct timestamp logic, ensure backend always uses sender: 'assistant' for assistant messages
          and sets metadata: { isFollowUp: true } for all but the last in a sequence.
        */}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if message content changed - ignore parent state changes
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.sessionId === nextProps.sessionId
  );
});

export default MessageBubble;