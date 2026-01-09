import { useState, useCallback } from 'react';

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

interface ContactFormErrors {
  name: string;
  email: string;
  message: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Custom hook for managing contact form state and validation.
 * Handles form data, error messages, submission state, and validation logic.
 */
export const useContactForm = (sessionId: string) => {
  const [contactForm, setContactForm] = useState<ContactFormData>({
    name: '',
    email: '',
    message: '',
  });
  const [contactFieldErrors, setContactFieldErrors] = useState<ContactFormErrors>({
    name: '',
    email: '',
    message: '',
  });
  const [contactError, setContactError] = useState('');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const validateContactForm = useCallback(() => {
    const errors: ContactFormErrors = { name: '', email: '', message: '' };
    let isValid = true;

    // Name validation
    if (!contactForm.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    } else if (contactForm.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
      isValid = false;
    }

    // Email validation
    if (!contactForm.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!EMAIL_REGEX.test(contactForm.email.trim())) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Message validation
    if (!contactForm.message.trim()) {
      errors.message = 'Message is required';
      isValid = false;
    } else if (contactForm.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters';
      isValid = false;
    } else if (contactForm.message.trim().length > 1000) {
      errors.message = 'Message must be less than 1000 characters';
      isValid = false;
    }

    setContactFieldErrors(errors);
    return isValid;
  }, [contactForm]);

  const isContactFormValid = useCallback(
    () =>
      contactForm.name.trim().length >= 2 &&
      EMAIL_REGEX.test(contactForm.email.trim()) &&
      contactForm.message.trim().length >= 10 &&
      contactForm.message.trim().length <= 1000,
    [contactForm],
  );

  const handleContactFormSubmit = useCallback(async () => {
    setContactError('');

    if (!validateContactForm()) {
      return;
    }

    setIsSubmittingContact(true);
    try {
      const response = await fetch(`/api/chat/${sessionId}/submit-form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData: [
            { id: 'name', label: 'Name', value: contactForm.name.trim() },
            { id: 'email', label: 'Email', value: contactForm.email.trim() },
            { id: 'message', label: 'Message', value: contactForm.message.trim() },
          ],
          formTitle: 'Contact Request - Message Limit Exceeded',
        }),
      });

      if (response.ok) {
        setContactSubmitted(true);
        setContactForm({ name: '', email: '', message: '' });
        setContactFieldErrors({ name: '', email: '', message: '' });
        // Auto-hide success message after 10 seconds
        setTimeout(() => setContactSubmitted(false), 10000);
      } else {
        setContactError('Failed to send message. Please try again.');
      }
    } catch (error) {
      setContactError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmittingContact(false);
    }
  }, [contactForm, sessionId, validateContactForm]);

  return {
    contactForm,
    setContactForm,
    contactFieldErrors,
    contactError,
    isSubmittingContact,
    contactSubmitted,
    setContactSubmitted,
    handleContactFormSubmit,
    isContactFormValid,
  };
};
