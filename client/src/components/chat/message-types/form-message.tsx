import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { FormMetadata } from "@/types/message-metadata";
import { parseMarkdown } from "@/lib/markdown-utils";
import { Send } from "lucide-react";

interface FormMessageProps {
  content: string;
  metadata: FormMetadata;
  sessionId?: string;
  messageId: number;
  chatbotConfig?: any;
}

export const FormMessage = memo(function FormMessage({ 
  content, 
  metadata, 
  sessionId, 
  messageId,
  chatbotConfig 
}: FormMessageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const currentSessionId = sessionId;

      if (!currentSessionId) {
        console.error('No session ID available for form submission');
        return;
      }

      const formData = metadata.formFields.map((field) => ({
        id: field.id,
        label: field.label,
        type: field.type,
        value: formValues[field.id] || ''
      }));

      const formTitle = metadata.title || 'Contact Form Submission';

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
        const confirmationText = chatbotConfig?.formConfirmationMessage || 
                               'Thank you! Your message has been sent successfully. We will contact you soon.';

        const confirmationMessage = {
          id: Date.now(),
          sessionId: currentSessionId,
          content: confirmationText,
          sender: 'bot' as const,
          messageType: 'text' as const,
          metadata: { emailSent: true, messageId: result.messageId },
          createdAt: new Date().toISOString(),
        };

        queryClient.setQueryData(['/api/chat', currentSessionId, 'messages'], (old: any) => {
          if (!old) return { messages: [confirmationMessage] };
          return { messages: [...old.messages, confirmationMessage] };
        });

        setFormValues({});
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

  const isFormValid = metadata.formFields.every((field) => 
    !field.required || (formValues[field.id] && formValues[field.id].trim() !== '')
  );

  return (
    <div className="bg-card rounded-lg rounded-tl-none shadow-sm border border-border overflow-hidden">
      <div className="p-4">
        {metadata.title && (
          <h4 className="font-semibold text-foreground mb-3">{metadata.title}</h4>
        )}

        {content && (
          <p 
            className="text-muted-foreground mb-4" 
            dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
          />
        )}

        <form className="space-y-4" onSubmit={handleFormSubmit}>
          {metadata.formFields.map((field, index) => (
            <div key={`${field.id}-${index}`} className="space-y-2">
              <label 
                htmlFor={field.id} 
                className="block text-sm font-medium text-foreground"
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
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 placeholder:text-muted-foreground"
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
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 placeholder:text-muted-foreground"
                />
              )}
            </div>
          ))}

          <Button
            type="submit"
            disabled={isSubmitting || !isFormValid}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Sending...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                {metadata.submitButton?.icon === "Send" && <Send className="h-4 w-4" />}
                {metadata.submitButton?.text || 'Send Message'}
              </div>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
});