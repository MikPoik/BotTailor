# AI Summary: server/email-service.ts

# Email Service Documentation

## Purpose
The `email-service.ts` file implements a service for sending emails using the Brevo email API. It facilitates the generation of email content from form submissions, allowing organizations to receive structured form data via email notifications.

## Key Functions

### Class: `BrevoEmailService`
- **Constructor**: Initializes the service with the Brevo API key retrieved from environment variables. Throws an error if the API key is not set.
  
- **Method: `generateEmailContent(data: FormSubmissionData)`**  
  Generates the HTML and plain text content for the email based on the submitted form data. It formats the email with a specified structure, including session details and field values.

- **Method: `sendFormSubmission(data: FormSubmissionData, recipientEmail: string, recipientName?: string, senderEmail?: string, senderName?: string)`**  
  Sends an email containing form submission data to a specified recipient. It utilizes the Brevo API and constructs the email content by calling `generateEmailContent`.

## Dependencies
- **Zod**: A TypeScript-first schema declaration and validation library used to define and infer types for the email API requests.
  
```typescript
import { z } from "zod";
```

## Architectural Context
The service is designed to be backend-oriented, focusing on email notifications triggered by user interactions through form submissions. It encapsulates both the email content generation logic and the API interaction, promoting a separation of concerns within the application.

- The usage of environment variables for API keys ensures sensitive data is not hard-coded, enhancing security.
- The schema validation via Zod ensures that the email requests conform to expected structures, reducing runtime errors and improving reliability.
  
This service can be integrated into a larger application where form data needs to be captured and communicated via email, such as in web applications, customer feedback tools, or chatbot interfaces.