import { z } from "zod";

// Brevo email API schemas
const BrevoEmailRequest = z.object({
  sender: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  to: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
  })),
  subject: z.string(),
  htmlContent: z.string(),
  textContent: z.string().optional(),
});

type BrevoEmailRequest = z.infer<typeof BrevoEmailRequest>;

// Form submission data structure
export interface FormSubmissionData {
  sessionId: string;
  formFields: Array<{
    id: string;
    label: string;
    type: string;
    value: string;
  }>;
  metadata?: {
    title?: string;
    chatbotName?: string;
  };
}

export class BrevoEmailService {
  private apiKey: string;
  private baseUrl = 'https://api.brevo.com/v3/smtp/email';

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('BREVO_API_KEY environment variable is required');
    }
  }

  /**
   * Generate HTML email content from form submission data
   */
  private generateEmailContent(data: FormSubmissionData): { html: string; text: string } {
    const title = data.metadata?.title || 'Form Submission';
    const chatbotName = data.metadata?.chatbotName || 'Chat Assistant';
    
    // HTML content
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px; }
        .header { background: #007bff; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: white; padding: 20px; border-radius: 0 0 8px 8px; }
        .field { margin-bottom: 15px; padding: 10px; border-left: 4px solid #007bff; background: #f8f9fa; }
        .field-label { font-weight: bold; color: #495057; margin-bottom: 5px; }
        .field-value { color: #212529; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            <p>New submission from ${chatbotName}</p>
        </div>
        <div class="content">
            <p><strong>Session ID:</strong> ${data.sessionId}</p>
            <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
            
            <h3>Form Data:</h3>
            ${data.formFields.map(field => `
                <div class="field">
                    <div class="field-label">${field.label}</div>
                    <div class="field-value">${field.value || '(No value provided)'}</div>
                </div>
            `).join('')}
        </div>
        <div class="footer">
            <p>This email was generated automatically from a form submission.</p>
        </div>
    </div>
</body>
</html>`;

    // Plain text content
    const text = `
${title}
New submission from ${chatbotName}

Session ID: ${data.sessionId}
Submitted at: ${new Date().toLocaleString()}

Form Data:
${data.formFields.map(field => `${field.label}: ${field.value || '(No value provided)'}`).join('\n')}

---
This email was generated automatically from a form submission.
`;

    return { html, text };
  }

  /**
   * Send form submission email via Brevo API
   */
  async sendFormSubmission(
    data: FormSubmissionData,
    recipientEmail: string,
    recipientName?: string,
    senderEmail?: string,
    senderName?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { html, text } = this.generateEmailContent(data);
      const title = data.metadata?.title || 'Form Submission';
      
      // Use environment variables with provided parameters as fallbacks
      const finalSenderEmail = process.env.BREVO_SENDER_EMAIL || senderEmail || 'noreply@chatbot.com';
      const finalSenderName = process.env.BREVO_SENDER_NAME || senderName || 'Chat Assistant';
      
      const emailRequest: BrevoEmailRequest = {
        sender: {
          name: finalSenderName,
          email: finalSenderEmail,
        },
        to: [{
          email: recipientEmail,
          name: recipientName || 'Recipient',
        }],
        subject: `${title} - ${new Date().toLocaleDateString()}`,
        htmlContent: html,
        textContent: text,
      };

      // Validate request data
      const validatedRequest = BrevoEmailRequest.parse(emailRequest);

      console.log(`[BREVO] Sending email to ${recipientEmail} for session ${data.sessionId}`);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(validatedRequest),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`[BREVO] API Error (${response.status}):`, errorData);
        return {
          success: false,
          error: `Email service error: ${response.status} - ${errorData}`,
        };
      }

      const result = await response.json();
      console.log(`[BREVO] Email sent successfully:`, result);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('[BREVO] Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Test the Brevo API connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const testEmail: BrevoEmailRequest = {
        sender: {
          name: 'Test Sender',
          email: 'test@example.com',
        },
        to: [{
          email: 'test@example.com',
          name: 'Test Recipient',
        }],
        subject: 'Test Connection',
        htmlContent: '<p>Test email</p>',
      };

      // Just validate the request structure without sending
      BrevoEmailRequest.parse(testEmail);
      
      // Test API key format
      if (!this.apiKey.startsWith('xkeysib-')) {
        return {
          success: false,
          error: 'Invalid API key format. Brevo API keys should start with "xkeysib-"',
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Configuration error',
      };
    }
  }
}

// Export singleton instance
export const brevoEmailService = new BrevoEmailService();