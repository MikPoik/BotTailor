import { memo } from "react";
import { formatDistanceToNow } from "date-fns";
import { Message } from "@shared/schema";
import { Button } from "@/components/ui/button";
import RichMessage from "./rich-message";
import StreamingMessage from "./streaming-message";
import { parseMarkdown } from "@/lib/markdown-utils";
import { isStreamingMetadata, MessageMetadata } from "@/types/message-metadata";

// Helper function to lighten or darken a color for better contrast
function adjustColorBrightness(color: string, percent: number): string {
  // For HSL colors
  const hslMatch = color.match(/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
  if (hslMatch) {
    const h = hslMatch[1];
    const s = hslMatch[2];
    const l = parseFloat(hslMatch[3]);
    const newL = Math.min(100, Math.max(0, l + percent));
    return `hsl(${h}, ${s}%, ${newL}%)`;
  }
  
  // For hex colors
  const hexMatch = color.match(/^#([A-Fa-f0-9]{6})$/);
  if (hexMatch) {
    const num = parseInt(hexMatch[1], 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return `#${(0x1000000 + (R * 0x10000) + (G * 0x100) + B).toString(16).slice(1)}`;
  }
  
  // Fallback: return original color with opacity
  return color;
}

// Color resolution function that prioritizes embed parameters over UI Designer theme
function resolveColors(chatbotConfig?: any) {
  // Get CSS variables from the embed parameters (these take priority)
  const embedPrimaryColor = getComputedStyle(document.documentElement).getPropertyValue('--chat-primary-color').trim();
  const embedBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--chat-background').trim();
  const embedTextColor = getComputedStyle(document.documentElement).getPropertyValue('--chat-text').trim();

  // Helper function to check if a color value is valid (not empty and not just fallback CSS var)
  const isValidColor = (color: string) => {
    return color && color !== '' && !color.startsWith('var(--') && color !== 'var(--primary)' && color !== 'var(--background)' && color !== 'var(--foreground)';
  };

  // Resolve final colors with embed parameters taking priority, then chatbot config, then CSS variables
  const backgroundColor = (isValidColor(embedBackgroundColor) ? embedBackgroundColor : 
                     chatbotConfig?.homeScreenConfig?.theme?.backgroundColor || 
                     chatbotConfig?.theme?.backgroundColor) || 'hsl(0, 0%, 100%)';
  
  const resolvedColors = {
    primaryColor: (isValidColor(embedPrimaryColor) ? embedPrimaryColor : 
                   chatbotConfig?.homeScreenConfig?.theme?.primaryColor || 
                   chatbotConfig?.theme?.primaryColor) || 'hsl(213, 93%, 54%)',
    backgroundColor: backgroundColor,
    textColor: (isValidColor(embedTextColor) ? embedTextColor : 
               chatbotConfig?.homeScreenConfig?.theme?.textColor || 
               chatbotConfig?.theme?.textColor) || 'hsl(20, 14.3%, 4.1%)',
    messageBubbleBg: adjustColorBrightness(backgroundColor, backgroundColor.includes('hsl') && parseFloat(backgroundColor.match(/([\d.]+)%\)$/)?.[1] || '50') < 50 ? 8 : -2)
  };

  return resolvedColors;
}

interface MessageBubbleProps {
  message: Message;
  onOptionSelect: (optionId: string, payload?: any, optionText?: string) => void;
  onQuickReply: (reply: string) => void;
  chatbotConfig?: any;
  sessionId?: string;
}

const MessageBubble = memo(function MessageBubble({ message, onOptionSelect, onQuickReply, chatbotConfig, sessionId }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  const colors = resolveColors(chatbotConfig);
  
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
        {!isStreamingMetadata(message.metadata) && !(message.metadata as MessageMetadata)?.isFollowUp && timeAgo && (
          <span className="text-xs text-muted-foreground mt-1 block">
            {timeAgo}
          </span>
        )}
      </div>
    </div>
  );
});

export default MessageBubble;