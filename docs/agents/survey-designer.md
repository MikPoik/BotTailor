# Survey Designer Overview

The survey-designer domain enables creation, editing, validation, and analytics for surveys within the chat widget platform. It serves both end-users (who take surveys) and admins/builders (who design and analyze surveys). This domain is distinct due to its specialized flows for survey authoring, question logic, and response tracking, separate from general chat or UI design.

## Key modules and files

- `client/src/pages/survey-builder.tsx` – Main UI for building and editing surveys, including question management and survey settings.
- `client/src/pages/survey-analytics.tsx` – Analytics dashboard for survey results and response statistics.
- `client/src/components/chat/survey-assistant-chatbox.tsx` – AI-powered assistant for generating and refining survey questions/configs.
- `server/routes/surveys.ts` – Express routes for survey CRUD, validation, and ownership checks.
- `server/openai/survey-menu-validator.ts` – Validates survey question types and AI-generated survey content.
- `shared/schema.ts` – Survey and survey session data models, Zod schemas, and types (e.g., `Survey`, `SurveySession`, `SurveyConfig`).

## Main types and contracts

- `Survey`, `SurveySession`, `SurveyConfig`, `SurveyQuestion` (from `shared/schema.ts`): Core types for survey structure, user progress, and question logic.
- API routes: `/api/chatbots/:chatbotId/surveys` for CRUD, `/api/surveys/:surveyId/analytics` for analytics.
- Validation contracts: Survey content and question types are validated using `SurveyValidationMetadata` and `SurveyValidationResult`.
- Cross-domain: Relies on `auth` for user/session validation, `database` for persistence, and may use `openai` for AI-powered survey generation.

## Important flows and edge cases

- Survey creation/editing: Admins use the builder UI, which interacts with backend routes for saving and updating surveys. AI assistant can auto-generate questions.
- Validation: All survey questions are validated for type, options, and logic before activation. Edge cases include malformed configs, invalid question types, and permission errors.
- Analytics: Survey responses are aggregated and displayed, with edge cases for incomplete or abandoned sessions.
- Security: Only chatbot owners can create/edit surveys for their bots. All routes require authentication and ownership checks.

## How to extend or modify this domain

- Add new question types: Update `SurveyConfig` and validation logic in both frontend and `survey-menu-validator.ts`.
- Extend analytics: Modify `survey-analytics.tsx` and backend analytics endpoints.
- Add routes: Update `server/routes/surveys.ts` and ensure new endpoints are covered by tests.
- Test: Run unit and integration tests for survey flows. Validate with real survey data and edge cases (e.g., invalid configs, concurrent edits).
- Pitfalls: Do not break existing survey data contracts or bypass validation. Always enforce ownership and authentication on all survey endpoints.
