# AI Summary: server/routes/contact.ts

# Contact Route Handler Documentation

## Purpose
The `contact.ts` file defines and manages the contact form submission functionality for the application. It provides an API endpoint to process user inquiries about sales and support, validating incoming data and sending email notifications through an external service (Brevo).

## Key Functions

- **`setupContactRoutes(app: Express)`**: 
  - Integrates the contact form submission endpoint (`/api/contact`) into the Express application.
  - Validates incoming form data using `Zod` schema for structure and requirements.
  - Determines the appropriate recipient (Sales or Support) based on the form submission type.
  - Uses the `BrevoEmailService` to send an email with the submission details.
  - Handles errors during validation and email sending, returning appropriate responses.

### Validation Schema
- **`contactFormSchema`**: A `Zod` schema that defines the expected structure of the contact form data, including:
  - `contactType`: Enum (sales, support)
  - `name`: String with a minimum of 2 characters
  - `email`: Valid email format
  - `company`: Optional string
  - `message`: String with a minimum of 10 characters

## Dependencies
- **Express**: The application framework used to handle routing and HTTP requests.
- **Zod**: A schema validation library used to define and validate the structure of incoming data.
- **BrevoEmailService**: A custom email service module that handles the logic for sending emails through Brevo (formerly SendinBlue).
- Environment Variables:
  - `BREVO_API_KEY`: Required for the Brevo service connection.
  - `BREVO_SUPPORT_EMAIL`, `BREVO_SALES_EMAIL`, `BREVO_RECIPIENT_EMAIL`: Configurable recipient emails based on the nature of the inquiry.
  - `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`: Configurable sender details for the email.

## Interaction with Other Files
This module depends on:
- **`../email-service`**: This file exports the `BrevoEmailService` and the `FormSubmissionData` type, which are crucial for preparing and sending email notifications. It establishes the connection to the Brevo email service.
- The values set in the environment variables defined outside of this file ensure proper functioning and security of the email notifications.

In summary, `contact.ts` serves as a point of interaction for users submitting inquiries on the