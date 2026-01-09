import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface ContactFormSubmissionProps {
  contactForm: {
    name: string;
    email: string;
    message: string;
  };
  setContactForm: (form: any) => void;
  contactFieldErrors: {
    name: string;
    email: string;
    message: string;
  };
  contactError: string;
  isSubmittingContact: boolean;
  contactSubmitted: boolean;
  onSubmit: () => Promise<void>;
  isContactFormValid: () => boolean;
  textColor: string;
  primaryColor: string;
}

export function ContactFormSubmission({
  contactForm,
  setContactForm,
  contactFieldErrors,
  contactError,
  isSubmittingContact,
  contactSubmitted,
  onSubmit,
  isContactFormValid,
  textColor,
  primaryColor,
}: ContactFormSubmissionProps) {
  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>
          Name
        </label>
        <Input
          type="text"
          value={contactForm.name}
          onChange={(e) =>
            setContactForm({ ...contactForm, name: e.target.value })
          }
          placeholder="Your name"
          className="w-full"
          style={{
            borderColor: contactFieldErrors.name ? '#ef4444' : textColor + '40',
            color: textColor,
            backgroundColor: textColor + '08',
          }}
          disabled={isSubmittingContact}
        />
        {contactFieldErrors.name && (
          <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
            {contactFieldErrors.name}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>
          Email
        </label>
        <Input
          type="email"
          value={contactForm.email}
          onChange={(e) =>
            setContactForm({ ...contactForm, email: e.target.value })
          }
          placeholder="your@email.com"
          className="w-full"
          style={{
            borderColor: contactFieldErrors.email ? '#ef4444' : textColor + '40',
            color: textColor,
            backgroundColor: textColor + '08',
          }}
          disabled={isSubmittingContact}
        />
        {contactFieldErrors.email && (
          <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
            {contactFieldErrors.email}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>
          Message
        </label>
        <textarea
          value={contactForm.message}
          onChange={(e) =>
            setContactForm({ ...contactForm, message: e.target.value })
          }
          placeholder="Your message..."
          className="w-full border rounded-lg p-2 resize-none focus:outline-none focus:ring-2"
          rows={4}
          style={{
            borderColor: contactFieldErrors.message ? '#ef4444' : textColor + '40',
            color: textColor,
            backgroundColor: textColor + '08',
            '--tw-ring-color': primaryColor,
          } as React.CSSProperties}
          disabled={isSubmittingContact}
        />
        <div className="flex justify-between items-start mt-1">
          {contactFieldErrors.message && (
            <p className="text-xs" style={{ color: '#ef4444' }}>
              {contactFieldErrors.message}
            </p>
          )}
          <p className="text-xs ml-auto" style={{ color: textColor + '60' }}>
            {contactForm.message.length}/1000
          </p>
        </div>
      </div>

      {contactError && (
        <div className="p-3 rounded-lg" style={{ backgroundColor: '#fee2e2', borderLeft: '3px solid #ef4444' }}>
          <p style={{ color: '#991b1b' }} className="text-sm">
            {contactError}
          </p>
        </div>
      )}

      <Button
        onClick={onSubmit}
        disabled={!isContactFormValid() || isSubmittingContact}
        className="w-full"
        style={{
          backgroundColor: primaryColor,
          color: 'white',
          opacity: isContactFormValid() && !isSubmittingContact ? 1 : 0.5,
        }}
      >
        {isSubmittingContact ? 'Sending...' : 'Send Message'}
      </Button>

      {contactSubmitted && (
        <div
          className="p-3 rounded-lg space-y-2"
          style={{ backgroundColor: '#dcfce7', borderLeft: '3px solid #16a34a' }}
        >
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-800 dark:text-green-200">
              Thank you! Your message has been sent successfully. We'll get back to you soon.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
