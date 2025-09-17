import type { Express } from "express";
import { z } from "zod";
import { BrevoEmailService, type FormSubmissionData } from "../email-service";

// Contact form validation schema
const contactFormSchema = z.object({
  contactType: z.enum(["sales", "support"]),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export function setupContactRoutes(app: Express) {
  // Contact form submission endpoint
  app.post('/api/contact', async (req, res) => {
    try {
      console.log(`[CONTACT_FORM] Processing contact form submission`);

      // Validate request body
      const validationResult = contactFormSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid form data',
          details: validationResult.error.errors,
        });
      }

      const { contactType, name, email, company, message } = validationResult.data;

      // Determine recipient based on contact type
      const isSupport = contactType === 'support';
      const recipientEmail = isSupport 
        ? process.env.BREVO_SUPPORT_EMAIL || process.env.BREVO_RECIPIENT_EMAIL || 'support@bottailor.com'
        : process.env.BREVO_SALES_EMAIL || process.env.BREVO_RECIPIENT_EMAIL || 'support@bottailor.com';
      
      const recipientName = isSupport ? 'Support Team' : 'Sales Team';
      const senderEmail = process.env.BREVO_SENDER_EMAIL || 'support@bottailor.com';
      const senderName = process.env.BREVO_SENDER_NAME || 'BotTailor Contact Form';

      // Check if Brevo is configured
      if (!process.env.BREVO_API_KEY) {
        console.warn(`[CONTACT_FORM] Brevo API key not configured`);
        return res.status(500).json({
          success: false,
          error: 'Email service is not configured. Please try again later.',
        });
      }

      // Prepare form submission data for Brevo service
      const formFields = [
        { id: 'contact_type', label: 'Contact Type', type: 'text', value: contactType === 'sales' ? 'Sales & Pricing' : 'Technical Support' },
        { id: 'name', label: 'Full Name', type: 'text', value: name },
        { id: 'email', label: 'Email Address', type: 'email', value: email },
        { id: 'company', label: 'Company', type: 'text', value: company || 'Not provided' },
        { id: 'message', label: 'Message', type: 'textarea', value: message },
      ];

      const submissionData: FormSubmissionData = {
        sessionId: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        formFields,
        metadata: {
          title: `${contactType === 'sales' ? 'Sales Inquiry' : 'Support Request'} - Contact Form`,
          chatbotName: 'BotTailor Contact Form',
        },
      };

      // Send email using Brevo service
      const brevoService = new BrevoEmailService();
      const emailResult = await brevoService.sendFormSubmission(
        submissionData,
        recipientEmail,
        recipientName,
        senderEmail,
        senderName
      );

      if (!emailResult.success) {
        console.error(`[CONTACT_FORM] Failed to send email:`, emailResult.error);
        return res.status(500).json({
          success: false,
          error: 'Failed to send email. Please try again later.',
        });
      }

      console.log(`[CONTACT_FORM] Contact form email sent successfully to ${recipientEmail}`);

      return res.json({
        success: true,
        message: 'Your message has been sent successfully. We will get back to you within 24 hours.',
      });

    } catch (error) {
      console.error(`[CONTACT_FORM] Error processing contact form:`, error);
      return res.status(500).json({
        success: false,
        error: 'An unexpected error occurred. Please try again later.',
      });
    }
  });
}