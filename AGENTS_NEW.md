## Project Overview

- This repository is an embeddable customer‑support chat widget and management webapp: a React + Vite frontend (`client/`) with a Node/Express TypeScript backend (`server/`).
- Core integrations: OpenAI for AI responses, Drizzle ORM + PostgreSQL (Neon) for persistence, Stripe for billing, Tailwind for styling. Key runtime versions visible in `package.json`: TypeScript 5.x, React 18.x, Vite 5.x.

## Repository Layout

- `client/` — React frontend (Vite), components, hooks, pages and embedding-related UI.
- `server/` — Express server, API routes, services, OpenAI integration, upload/storage helpers.
- `shared/` — shared types and DB schema (`shared/schema.ts`).
- `docs/` — human and agent-facing domain docs (see `docs/agents/*`).
- `public/` — static assets and embed entry (`public/embed.js`, `public/embed.css`).
- `scripts/` — generator and utility scripts (SEO, docs, scans).
- Root files: `package.json` (scripts/deps), `drizzle.config.ts` (DB config), `vite.config.ts`.

## Domains & Responsibilities

- Authentication
  - Purpose: app auth and session management; Neon auth integration.
  - Key files: [server/neonAuth.ts](server/neonAuth.ts), [server/routes/auth.ts](server/routes/auth.ts).
  - Docs: [docs/agents/auth.md](docs/agents/auth.md).

- Database / Persistence
  - Purpose: schema, migrations, and DB access via Drizzle ORM.
  - Key files: [shared/schema.ts](shared/schema.ts), `drizzle.config.ts`, [server/db.ts](server/db.ts).
  - Note: use `drizzle-kit` commands for migrations (`npm run db:push`). See [docs/agents/database.md](docs/agents/database.md).

- OpenAI / AI Response
  - Purpose: build prompts, streaming responses, parsing and safety checks.
  - Key files: [server/openai/](server/openai/) (client.ts, streaming-handler.ts, response-generator.ts, response-parser.ts).
  - Docs: [docs/agents/openai.md](docs/agents/openai.md).

- Embeds & UI Designer
  - Purpose: embeddable widget runtime and design service for generating embed payloads.
  - Key files: [public/embed.js](public/embed.js), [server/embed-service.ts](server/embed-service.ts), [server/ui-designer-service.ts](server/ui-designer-service.ts).
  - Docs: [docs/agents/embed-designs.md](docs/agents/embed-designs.md), [docs/agents/ui-designer.md](docs/agents/ui-designer.md).

- Storage & Uploads
  - Purpose: file uploads and storage adapter (S3-compatible and Replit storage adapters supported).
  - Key files: [server/upload-service.ts](server/upload-service.ts), [server/storage.ts](server/storage.ts).
  - Docs: [docs/agents/storage.md](docs/agents/storage.md).

- Billing / Subscriptions
  - Purpose: Stripe checkout and webhook handling.
  - Key files: [server/routes/subscription.ts](server/routes/subscription.ts).
  - Docs: [docs/agents/billing.md](docs/agents/billing.md).

- Frontend UX / Hooks
  - Purpose: shared hooks and client streaming/parsing for chat UI.
  - Key files: [client/src/hooks/use-chat.ts](client/src/hooks/use-chat.ts), [client/src/hooks/useStreamingMessage.ts](client/src/hooks/useStreamingMessage.ts).
  - Docs: [docs/agents/frontend.md](docs/agents/frontend.md).

## Coding Conventions & Patterns

- Language: TypeScript across client, server, and shared code. Prefer `strict`-style types.
- Validation: use `zod` schemas (see `drizzle-zod` usage) for runtime validation.
- ORM: use Drizzle for queries and migrations. Do not hand-edit compiled migration artifacts.
- Shared types & schema: place cross-runtime types in `shared/` and reference them rather than duplicating.
- Client patterns: put reusable logic into `client/src/hooks/` and UI bits into `client/src/components/`.
- Error handling: prefer centralized handlers (`server/openai/error-handler.ts`) and return structured errors from services.

Do / Do Not

- Do: update corresponding `docs/agents/*.md` when changing domain behavior or contracts.
- Do: run `npm run check` (TypeScript) and `npm run dev` locally before major changes.
- Do Not: edit DB migration history or `drizzle` generated artifacts manually without coordinating with the team.
- Do Not: commit secrets or `.env` values to the repo.

## Safety & Constraints

- External API costs: OpenAI and Stripe calls are billable — avoid running large batches of real API calls in CI or on dev machines. Use mocks or test keys.
- Destructive ops: avoid running destructive DB commands or direct production data modifications. Prefer running `drizzle-kit` operations only with CI approval.
- Infra & CI: do not change infra, deployment (`fly.toml`), or CI configs without explicit approval.
- Embed contract: `public/embed.js` is a public integration point — changes can break many hosts. Coordinate before modifying embed runtime.

## How Agents Should Work Here

- Read this file and the domain doc(s) for the area you're changing before editing code.
- Local dev quick-start (from repo root):

```bash
npm install
npm run dev    # starts server via tsx for local development
npm run check  # typecheck
npm run build  # production build
```

- When adding features: update the nearest `docs/agents/<domain>.md` doc and, if the change affects agent onboarding or conventions, update `AGENTS_NEW.md`.
- Tests & verification: there are no broad integration test suites committed; prefer small, focused tests and Playwright snapshots if adding E2E checks.

## Open Questions / Assumptions

- Assumed primary DB is Neon/Postgres (see `@neondatabase/serverless` and `drizzle.config.ts`) — confirm production DB provider and credentials.
- SSE/streaming contract: clients expect newline-prefixed `data: ` frames from the streaming chat API — do not change that contract without updating both `server/openai/*` and `client/src/hooks/use-chat.ts`.
- CI and deployment details (secrets, registry) are not included here — confirm with repository owners before changing build/deploy steps.

---

If something critical is missing from these notes (deploy targets, CI secrets owners, or a test harness), add it to `docs/agents/` and update this file.
