import { useState } from "react";
import { Message } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

// Function to parse Markdown to HTML
function parseMarkdown(text: string): string {
  let html = text;

  // Bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

  // Italic text
  html = html.replace(/\*(.*?)\*/g, '<i>$1</i>');

  // Markdown links: [text](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">$1</a>');

  // Auto-detect URLs (http/https)
  html = html.replace(/(https?:\/\/[^\s<>"]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">$1</a>');

  // Line breaks
  html = html.replace(/\n/g, '<br />');

  return html;
}

interface RichMessageProps {
  message: Message;
  onOptionSelect: (optionId: string, payload?: any, optionText?: string) => void;
  onQuickReply: (reply: string) => void;
  chatbotConfig?: any;
  sessionId?: string;
}

export default function RichMessage({ message, onOptionSelect, onQuickReply, chatbotConfig, sessionId }: RichMessageProps) {
  const { messageType, content, metadata } = message;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  if (messageType === 'card' && metadata) {
    const cardMeta = metadata as any;
    return (
      <div className="bg-white rounded-lg rounded-tl-none shadow-sm overflow-hidden border">
        {cardMeta.imageUrl && (
          <img 
            src={cardMeta.imageUrl} 
            alt={cardMeta.title || "Card image"} 
            className="w-full h-32 object-cover"
          />
        )}

        <div className="p-3">
          {cardMeta.title && (
            <h4 className="font-semibold text-neutral-800 mb-2">{cardMeta.title}</h4>
          )}

          {cardMeta.description && (
            <p className="text-sm text-neutral-600 mb-3">{cardMeta.description}</p>
          )}

          {content && content !== cardMeta.title && (
            <p className="text-neutral-800 mb-3">{content}</p>
          )}

          {cardMeta.buttons && (
            <div className="space-y-2">
              {cardMeta.buttons.map((button: any, index: number) => (
                <Button
                  key={`${button.id}-${index}`}
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

  if (messageType === 'menu' && (metadata as any)?.options) {
    const menuMeta = metadata as any;
    return (
      <div className="space-y-2">
        <div className="space-y-2">
          {menuMeta.options.map((option: any, index: number) => (
            <button
              key={`${option.id}-${index}`}
              onClick={() => onOptionSelect(option.id, option.payload, option.text)}
              className="w-full text-left py-2 px-3 border border-neutral-200 rounded-lg transition-colors flex items-center space-x-2 menu-option-button"
            >
              {option.icon && (
                <i className={`${option.icon} text-primary`}></i>
              )}
              <span className="rich-message-text">{option.text}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (messageType === 'image' && (metadata as any)?.imageUrl) {
    const imageMeta = metadata as any;
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

  if (messageType === 'quickReplies' && (metadata as any)?.quickReplies) {
    const quickMeta = metadata as any;
    return (
      <div className="flex flex-wrap gap-2">
        {quickMeta.quickReplies.map((reply: string, index: number) => (
          <button
            key={`quickreply-${reply}-${index}`}
            onClick={() => onQuickReply(reply)}
            className="px-3 py-1 text-sm bg-neutral-100 text-neutral-700 rounded-full hover:bg-neutral-200 transition-colors"
          >
            {reply}
          </button>
        ))}
      </div>
    );
  }

  if (messageType === 'form' && (metadata as any)?.formFields) {
    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        const currentSessionId = sessionId || message.sessionId;
        
        if (!currentSessionId) {
          console.error('No session ID available for form submission');
          return;
        }
        
        // Collect form data
        const formData = (metadata as any)?.formFields?.map((field: any) => ({
          id: field.id,
          label: field.label,
          type: field.type,
          value: formValues[field.id] || ''
        })) || [];

        const formTitle = (metadata as any)?.title || 'Contact Form Submission';

        console.log('Submitting form:', { sessionId: currentSessionId, formData });

        const response = await fetch(`/api/chat/${currentSessionId}/submit-form`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            formData,
            formTitle
          })
        });

        const result = await response.json();

        if (result.success) {
          console.log('Form submitted successfully:', result);
          
          // Add confirmation message directly to the chat
          const confirmationText = chatbotConfig?.formConfirmationMessage || 
                                 'Thank you! Your message has been sent successfully. We will contact you soon.';
          
          const confirmationMessage = {
            id: Date.now().toString(),
            sessionId: currentSessionId,
            content: confirmationText,
            sender: 'bot' as const,
            messageType: 'text' as const,
            metadata: { emailSent: true, messageId: result.messageId },
            createdAt: new Date().toISOString(),
          };

          // Update the query cache with the new message
          queryClient.setQueryData(['/api/chat', currentSessionId, 'messages'], (old: any) => {
            if (!old) return { messages: [confirmationMessage] };
            return { messages: [...old.messages, confirmationMessage] };
          });
          
          setFormValues({}); // Clear form
        } else {
          console.error('Form submission failed:', result);
        }
      } catch (error) {
        console.error('Error submitting form:', error);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleInputChange = (fieldId: string, value: string) => {
      setFormValues(prev => ({ ...prev, [fieldId]: value }));
    };

    return (
      <div className="bg-white rounded-lg rounded-tl-none shadow-sm border overflow-hidden">
        <div className="p-4">
          {(metadata as any)?.title && (
            <h4 className="font-semibold text-neutral-800 mb-3">{(metadata as any).title}</h4>
          )}

          {content && (
            <p 
              className="text-neutral-600 mb-4" 
              dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
            />
          )}

          <form className="space-y-4" onSubmit={handleFormSubmit}>
            {(metadata as any)?.formFields?.map((field: any, index: number) => (
              <div key={`${field.id}-${index}`} className="space-y-2">
                <label 
                  htmlFor={field.id} 
                  className="block text-sm font-medium text-neutral-700"
                >
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {field.type === 'textarea' ? (
                  <textarea
                    id={field.id}
                    name={field.id}
                    placeholder={field.placeholder}
                    required={field.required}
                    value={formValues[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    rows={3}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                  />
                ) : (
                  <input
                    id={field.id}
                    name={field.id}
                    type={field.type}
                    placeholder={field.placeholder}
                    required={field.required}
                    value={formValues[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                )}
              </div>
            ))}

            {(metadata as any)?.submitButton && (
              <Button
                type="submit"
                className="w-full mt-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : (metadata as any).submitButton.text}
              </Button>
            )}
          </form>
        </div>
      </div>
    );
  }

  // Fallback to regular message
  return (
    <div className={`chat-message-bot ${(message.messageType === 'menu' || message.messageType === 'quickReplies' || message.messageType === 'form' || message.messageType === 'table') ? 'no-background' : ''}`}>
      <p className="text-neutral-800">{content}</p>
    </div>
  );
}