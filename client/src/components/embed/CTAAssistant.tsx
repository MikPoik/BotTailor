import React, { useState, useRef, useEffect } from 'react';
import { CTAConfig } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { Send, Loader } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  config?: CTAConfig;
  timestamp: Date;
}

interface CTAAssistantProps {
  chatbotName?: string;
  onConfigGenerated?: (config: CTAConfig) => void;
  currentConfig?: CTAConfig;
  theme?: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
  };
}

/**
 * CTAAssistant - AI-powered CTA generation interface
 * 
 * Allows users to describe their desired CTA and generates
 * complete configurations using OpenAI
 */
export const CTAAssistant: React.FC<CTAAssistantProps> = ({
  chatbotName = 'Support',
  onConfigGenerated,
  currentConfig,
  theme,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `👋 Hi! I'm your CTA Assistant. Describe the CTA you'd like to create, and I'll generate a complete configuration for you. For example: "Create a modern onboarding CTA with features and a blue theme" or "Make a dark-themed CTA with wave pattern and badge features"`,
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    try {
      const response = await apiRequest('POST', '/api/cta/generate', {
        prompt: input,
        chatbotName,
        stream: false,
        currentConfig,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate CTA');
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.description,
        config: data.config,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Notify parent of generated config
      onConfigGenerated?.(data.config);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to generate CTA';

      const errorAssistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${errorMessage}. Please try again with a different prompt.`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorAssistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const primaryColor = theme?.primaryColor || '#2563eb';
  const backgroundColor = theme?.backgroundColor || '#ffffff';
  const textColor = theme?.textColor || '#1f2937';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '460px',
        backgroundColor: backgroundColor,
        borderRadius: '8px',
        overflow: 'hidden',
        border: `1px solid #e5e7eb`,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          backgroundColor: primaryColor,
          color: 'white',
          fontWeight: 600,
          borderBottom: `1px solid #e5e7eb`,
        }}
      >
        ✨ CTA AI Assistant
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          minHeight: '320px',
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              gap: '8px',
            }}
          >
              <div
                style={{
                  maxWidth: '80%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor:
                    message.role === 'user' ? primaryColor : '#f3f4f6',
                  color:
                    message.role === 'user' ? 'white' : textColor,
                  wordBreak: 'break-word',
                  lineHeight: 1.4,
                  fontSize: '13px',
                }}
            >
              {message.content}
              {message.config && (
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    opacity: 0.9,
                    fontStyle: 'italic',
                  }}
                >
                  ✅ Config applied! Customize in the builder.
                </div>
              )}
            </div>
          </div>
        ))}

        {streamingContent && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              gap: '8px',
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: '#f3f4f6',
                color: textColor,
                wordBreak: 'break-word',
                lineHeight: 1.4,
                fontSize: '13px',
              }}
            >
              {streamingContent}
            </div>
          </div>
        )}

        {isLoading && !streamingContent && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <Loader
              size={16}
              style={{
                animation: 'spin 1s linear infinite',
              }}
            />
            <span style={{ fontSize: '13px', color: textColor, opacity: 0.6 }}>
              Generating your CTA...
            </span>
          </div>
        )}

      </div>

      {/* Input */}
      <div
        style={{
          padding: '12px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your CTA..."
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          style={{
            flex: 1,
            padding: '10px 12px',
            border: `1px solid #e5e7eb`,
            borderRadius: '6px',
            fontSize: '13px',
            outline: 'none',
            transition: 'border-color 0.2s',
            backgroundColor: backgroundColor,
            color: textColor,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = primaryColor;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
        />
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={isLoading || !input.trim()}
          style={{
            padding: '10px 16px',
            backgroundColor: isLoading ? '#9ca3af' : primaryColor,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'opacity 0.2s',
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          <Send size={16} />
          Send
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default CTAAssistant;
