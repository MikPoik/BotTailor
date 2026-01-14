
# Architecture Overview

Concise map of the repository and runtime responsibilities. This is a full‑stack TypeScript app with a Vite/React frontend (CSR + SSR), a Node/Express‑style backend, a Postgres database (Drizzle ORM), and server‑side AI integrations.

## Key modules and files
- Frontend: `client/`
	- Vite + React 18 app. CSR entry: `client/src/main.tsx`. SSR entry: `client/src/entry-server.tsx` (`generateHTML`, `render`, `generateMetaTags`).
	- Components: `client/src/components/`; routes and metadata in `client/src/routes` and `routes/registry`.
- Server: `server/`
	- App entry: `server/index.ts` (middleware, logging, auth setup, route registration, dev vs production static serving).
	- Route wiring: `server/routes.ts` → modular routes in `server/routes/index.ts` and `server/routes/*`.
	- Vite/SSR helpers: `server/vite.ts` (dev middleware, SSR orchestration, production static serving).
- AI: `server/openai/`
	- Client, prompt/context builders, streaming and non‑stream generators, parser/validation and regeneration logic. Shared types in `server/ai-response-schema.ts`.
- Storage & DB:
	- Storage interface & implementation: `server/storage.ts` (implements `IStorage`, many helpers used across the app).
	- DB connection: `server/db.ts` and schema types in `shared/schema.ts`; migrations in `migrations/`; Drizzle config at `drizzle.config.ts`.
- Other infra:
	- Uploads: `server/upload-service.ts`; email, embedding, and other domain services under `server/`.
	- Config and environment: `Dockerfile`, `fly.toml`, and top‑level env usage across server files.

## Main runtime flows and contracts
- HTTP server boot: `server/index.ts` sets up auth, JSON parsing (but leaves webhook raw body), CORS (embed allowed), logging, and registers routes before enabling Vite dev middleware or serving static production assets.
- SSR: In development `server/vite.ts` uses Vite middleware and loads `client/src/entry-server.tsx` via `ssrLoadModule`; in production it loads a built SSR module. SSR decision is made via `shouldSSR()` exported from the routes/registry.
- API routing: modular routes live in `server/routes/*` and are registered by `server/routes/index.ts` (exposed via `server/routes.ts`).
- AI generation: `server/openai/*` uses `response_format: json_schema` or `json_object` with streaming and non‑stream logic; streaming accumulates deltas, detects JSON boundaries and may regenerate via enhanced prompts on validation failures.
- Storage contract: `server/storage.ts` exposes `IStorage` methods (users, sessions, messages, chatbot configs, website content, surveys, subscriptions) — update usages when changing these contracts.

## Important edge cases and operational notes
- Webhooks: routes under `/api/webhook` expect raw body parsing for signature verification — middleware ordering matters.
- Embeds: CORS and host handling allow embed usage across origins; `server/index.ts` enables permissive CORS for the embed widget.
- Dev vs Prod: Vite middleware runs only in `NODE_ENV === 'development'`; production serves static `dist/public` assets via `server/vite.ts::serveStatic()`.
- AI parsing: model output shape changes require simultaneous updates to `server/openai/schema.ts`, `response-parser.ts`, and any UI consumers.

## How to change things safely
- UI changes: edit `client/src/components/`, `client/src/pages/`, and `App.tsx`; test both CSR and SSR paths using dev server.
- Add API routes: create `server/routes/<domain>.ts`, export a router from `server/routes/index.ts` so `registerRoutes()` picks it up.
- DB schema changes: update `shared/schema.ts`, add a migration in `migrations/`, and verify `server/storage.ts` uses the new columns/relations.
- AI/schema changes: update `server/openai/schema.ts`, parser (`response-parser.ts`), and `server/ai-response-schema.ts` together; add parser unit tests and mock streaming integration tests.

## Assumptions & environment
- Required env variables commonly used: `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, storage credentials (GCP/AWS), and `APP_URL` for redirects in production.
- The codebase assumes Postgres + Drizzle and a singleton OpenAI client (`server/openai/client.ts`).

Read the domain docs in this folder for focused, per‑domain details (auth, openai, database, storage, billing, frontend, infra).
