# AGENTS — Repo Guide for AI Coding Agents and Developers

This project is a full-stack React chat widget application featuring an Express.js backend and a React frontend. Its primary purpose is to provide an embeddable customer support chat widget for any website. The widget supports rich messaging, including text, interactive cards, menus, and quick replies, aiming to offer a comprehensive and customizable communication tool for businesses. The vision is to enable seamless integration of sophisticated chat functionalities, enhancing user engagement and support capabilities across various web platforms.

## Purpose

This file is a concise operating summary for AI coding agents and humans working in this repository. It explains where to find domain documentation, the recommended read order, and key conventions to follow when making code or documentation changes.

## Universal AI Coding Workflow

Always start by briefly rephrasing the user’s goal before any tool use. When using tools, explain why (purpose) not what you’re doing. Use a to-do list to track progress. Keep summaries under three sentences and never self-reference.

**Workflow:**
1. Deeply understand the issue—expected behavior, edge cases, dependencies, pitfalls, context.
2. Explore relevant code and files and agent docs.
3. Research external sources if needed.
4. Privately plan next steps (do not display).
5. Implement small, testable changes.
6. Debug logically and isolate issues.
7. Test after each change.
8. Iterate until root cause is fixed and all tests pass.
9. Validate thoroughly—ensure intent is met, add tests for hidden cases.
10. Update `docs/agents/*.md` documents where relevant and write codefile comments/header comments

## Project Overview

- **Tech stack:** TypeScript full‑stack (React + Vite on the frontend; Node/TypeScript on the server). Uses Drizzle ORM with PostgreSQL (Neon), OpenAI integrations, and Stripe for billing. Build tooling: Vite, Tailwind, and typical Node tooling in `package.json`.
- **High-level architecture:** Frontend React app (`client/`) + Node API and server code (`server/`) + shared types and schema (`shared/`) + PostgreSQL database (`migrations/` + drizzle `shared/schema.ts`). Static embed assets live in `public/`.

## Read Order (Recommended)

1. Start with `docs/agents/architecture.md` to get the overall layout and SSR/embed distinctions.
2. Then read the domain docs relevant to your task (OpenAI, API, Auth, Database, Billing, Frontend, Storage, UI Designer).
3. When implementing changes, consult the canonical code locations referenced by each domain doc (e.g., `server/openai/*`, `shared/schema.ts`, `server/routes/subscription.ts`).

## Generated Domain Docs (One-line Descriptions)

- `docs/agents/architecture.md` – High-level system architecture and SSR/embed notes.
- `docs/agents/openai.md` – OpenAI usage, streaming contract, response schema and regeneration behavior.
- `docs/agents/api.md` – HTTP API routes, webhook raw-body requirements, and request/response contracts.
- `docs/agents/auth.md` – Authentication and authorization flows; Neon auth header middleware behavior.
- `docs/agents/database.md` – Drizzle schema overview, key tables, and embedding/vector details.
- `docs/agents/billing.md` – Stripe integration, checkout/session flow, and webhook event handling.
- `docs/agents/frontend.md` – Client-side streaming parsing, `useChat` behavior, and embed hydration.
- `docs/agents/storage.md` – Storage adapter surface, upload flows (presign, multipart, streaming), and operational caveats.
- `docs/agents/ui-designer.md` – UI Designer artifact schema, embed config keys, and embed design service API.
- `docs/agents/survey-designer.md` – Survey creation, editing, validation, and analytics flows.
- `docs/agents/embed-designs.md` – Embeddable design payloads, `public/embed.js`, server embed service, and host integration rules.

## Conventions & Patterns

- **Language & typing:** TypeScript across client, server, and shared code. Shared runtime types and Zod/Drizzle schemas live in `shared/` (use `HomeScreenConfigSchema` and other Zod schemas when validating).
- **Folder layout:** `client/` (frontend), `server/` (API + services), `shared/` (schemas/types), `docs/` (documentation), `public/` (static embeds). Follow these boundaries when adding new code.
- **Naming:** Use clear descriptive names for DB tables in `shared/schema.ts`, `chatbotConfig`, `embedDesign`, and `embedDesignComponents` style for embed-related entities. Prefix server helper files with their domain (e.g., `ui-designer-service.ts`).
- **Streaming & API contracts:** The streaming chat API uses newline-prefixed `data: ` frames and JSON event shapes (bubble, complete, error, limit_exceeded). Clients expect this contract — update both `server/openai/*` and `client/src/hooks/use-chat.ts` when changing it.
- **Env & secrets:** Keep secrets in env vars (e.g., `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, OpenAI key, storage provider keys). Webhook endpoints require raw body verification; do not add JSON body-parsing middleware before webhook verification routes.
- **Testing:** Prefer small, focused unit tests for service logic and integration tests for end-to-end flows. 
- **Documentation:** Update the corresponding `docs/agents/*.md` domain doc when changing behavior; include code file links and critical operational caveats (e.g., raw webhook body, embedding vector dims, streaming frame shapes).
