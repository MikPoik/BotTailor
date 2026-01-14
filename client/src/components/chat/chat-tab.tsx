import { useRef, useEffect, memo } from 'react';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import MessageBubble from './message-bubble';
import TypingIndicator from './typing-indicator';
import { ContactFormSubmission } from './contact-form-submission';
import { Message } from '@shared/schema';

interface ChatTabProps {
  messages: any[];
  inputMessage: string;
  onInputChange: (message: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSendMessage: (message: string) => void;
  onOptionSelect: (optionId: string, payload?: any, optionText?: string) => void;
  onQuickReply: (reply: string) => void;
  chatIsTyping: boolean;
  isStreaming: boolean;
  isLoading: boolean;
  readOnlyMode: boolean;
  limitExceededInfo: any;
  chatbotConfig: any;
  sessionId: string;
  colors: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
  };
  inputBackground: string;
  isMobile: boolean;
  isEmbedded: boolean;
  // Contact form props
  contactForm: any;
  setContactForm: (form: any) => void;
  contactFieldErrors: any;
  contactError: string;
  isSubmittingContact: boolean;
  contactSubmitted: boolean;
  onContactFormSubmit: () => Promise<void>;
  isContactFormValid: () => boolean;
}

export function ChatTab({
  messages,
  inputMessage,
  onInputChange,
  onKeyPress,
  onSendMessage,
  onOptionSelect,
  onQuickReply,
  chatIsTyping,
  isStreaming,
  isLoading,
  readOnlyMode,
  limitExceededInfo,
  chatbotConfig,
  sessionId,
  colors,
  inputBackground,
  isEmbedded,
  contactForm,
  setContactForm,
  contactFieldErrors,
  contactError,
  isSubmittingContact,
  contactSubmitted,
  onContactFormSubmit,
  isContactFormValid,
}: ChatTabProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const isUserNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 200;
    const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
    return isNearBottom;
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatIsTyping, isStreaming]);

  // Add mount/unmount detection
  useEffect(() => {
    console.log('[ChatTab] MOUNTED', { timestamp: Date.now() });
    return () => {
      console.log('[ChatTab] UNMOUNTED', { timestamp: Date.now() });
    };
  }, []);

  return (
    <>
      {/* Messages area - takes remaining space above input */}
      <div
        ref={messagesContainerRef}
        className={`flex-1 overflow-y-auto p-4 space-y-4 min-h-0 messages-container ${
          isEmbedded ? 'embedded-messages-area' : ''
        }`}
        style={{
          backgroundColor: colors.backgroundColor,
          color: colors.textColor,
          willChange: 'scroll-position',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          contain: 'layout style paint',
        }}
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center" style={{ color: colors.textColor, opacity: 0.7 }}>
              <p className="text-sm">
                {chatbotConfig?.welcomeMessage || 'Start typing to begin the conversation'}
              </p>
            </div>
          </div>
        ) : (
          (() => {
            console.log('[ChatTab KEYS]', messages.map(m => (m as any)._stableKey || `message-${m.id}`));
            return messages.map((message, idx) => {
              const prev = messages[idx - 1];
              const next = messages[idx + 1];
              // Treat both 'assistant' and 'bot' as assistant for legacy support
              const isAssistant = message.sender === 'assistant' || message.sender === 'bot';
              const prevIsAssistant = prev && (prev.sender === 'assistant' || prev.sender === 'bot');
              // Show avatar if this is an assistant message and either it's the first message, or the previous message is not assistant
              const showAvatar = isAssistant && (!prev || !prevIsAssistant);
              // Defensive: always treat metadata as object
              const nextMetadata = (next && typeof next.metadata === 'object' && next.metadata) ? next.metadata : {};
              // Show timestamp if this is the last in a contiguous group of same-sender and same-response messages
              const showTimestamp = !next || next.sender !== message.sender || !nextMetadata.isFollowUp;
              // Only show timestamp for last assistant bubble in sequence
              const isLastInSequence = isAssistant && (!next || !(next.sender === 'assistant' || next.sender === 'bot') || !nextMetadata.isFollowUp);
              return (
                <MessageBubble
                  key={(message as any)._stableKey || `message-${message.id}`}
                  message={{ ...message, metadata: message.metadata || {} }}
                  onOptionSelect={onOptionSelect}
                  onQuickReply={onQuickReply}
                  chatbotConfig={chatbotConfig}
                  sessionId={sessionId}
                  showAvatar={showAvatar}
                  isLastInSequence={isLastInSequence}
                  showTimestamp={showTimestamp}
                />
              );
            })})()
        )}

        {(chatIsTyping || isStreaming) && <TypingIndicator chatbotConfig={chatbotConfig} />}

        {limitExceededInfo && (
          <div className="flex items-center justify-center">
            <div
              className="rounded-lg p-4 text-center w-full mx-2"
              style={{ backgroundColor: colors.primaryColor + '10' }}
            >
              <p style={{ color: colors.textColor }} className="text-sm">
                {limitExceededInfo.message}
              </p>
              {limitExceededInfo.showForm && (
                <ContactFormSubmission
                  contactForm={contactForm}
                  setContactForm={setContactForm}
                  contactFieldErrors={contactFieldErrors}
                  contactError={contactError}
                  isSubmittingContact={isSubmittingContact}
                  contactSubmitted={contactSubmitted}
                  onSubmit={onContactFormSubmit}
                  isContactFormValid={isContactFormValid}
                  textColor={colors.textColor}
                  primaryColor={colors.primaryColor}
                />
              )}
              {contactSubmitted && (
                <div
                  className="p-3 rounded-lg space-y-2 mt-4"
                  style={{ backgroundColor: '#dcfce7', borderLeft: '3px solid #16a34a' }}
                >
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Thank you! Your message has been sent successfully. We'll get back to you soon.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area - fixed height */}
      <div
        className="border-t px-4 py-1 flex-shrink-0"
        style={{
          backgroundColor: colors.backgroundColor,
          borderColor: colors.textColor + '30',
        }}
      >
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder={readOnlyMode ? 'Chat temporarily unavailable' : ''}
              value={inputMessage}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyPress={onKeyPress}
              className="send-input rounded-full pr-12 focus:ring-2 focus:border-transparent"
              style={{
                backgroundColor: inputBackground,
                color: colors.textColor,
                borderColor: colors.textColor + '40',
                '--tw-ring-color': colors.primaryColor,
                fontSize: '14px',
              } as React.CSSProperties}
              disabled={isLoading || readOnlyMode}
            />
            <Button
              type="button"
              onClick={() => onSendMessage(inputMessage)}
              disabled={!inputMessage.trim() || isLoading || readOnlyMode}
              size="sm"
              className="send-button absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full h-8 w-8 p-0"
              style={{
                backgroundColor: colors.primaryColor,
                borderColor: colors.primaryColor,
                color: 'white',
              }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export const ChatTabMemoized = memo(ChatTab);
