 # Backend API Overview

 Concise map of the HTTP API surface, request lifecycle, and extensions points. The backend is implemented in `server/` as an Express‑style TypeScript app; routes are modular under `server/routes/` and SSR/static serving is integrated via `server/vite.ts`.

 ## Key modules and files
 - `server/index.ts` — app entry: middleware ordering, webhook raw body handling, logging, auth setup, and route registration.
 - `server/routes.ts` → `server/routes/index.ts` and `server/routes/*` — modular route groups (auth, chat, embeds, uploads, subscription, public routes).
 - `server/vite.ts` — dev Vite middleware, SSR orchestration in development and production static serving (uses `client/src/entry-server.tsx`).
 - `server/openai/` — AI controllers and helpers used by API endpoints (see AI domain for details on streaming, parsing, and regeneration).
 - `server/upload-service.ts`, `server/embed-service.ts` — orchestrators for uploads and embed flows.
 - `server/neonAuth.ts` — authentication middleware wired at startup.
 - `server/storage.ts` — single storage implementation used across routes (DB access, session/survey management).

 ## Main types and contracts
 - HTTP handlers return JSON or streaming responses; DTOs and types live in `shared/` and `server/ai-response-schema.ts`.
 - Authentication: middleware may attach normalized user identity (headers like `x-stack-user-id` are accepted for some flows); public/embed routes intentionally relax auth.
 - Webhooks: routes under `/api/webhook` require raw request body for signature verification — middleware ordering is important.
 - Uploads: handled via `server/upload-service.ts` and persisted via `server/storage.ts` (supports multipart and signed flows).

 ## Important flows and edge cases
 - Streaming responses: chat endpoints use OpenAI streaming; server accumulates deltas and parses JSON frames. Clients expect the multi‑bubble framing — changing that format requires coordinated client/server updates.
 - Parsing & validation: API uses `server/openai/response-parser.ts` and server‑side validation/regeneration; malformed or partial model output triggers salvage/regeneration or a textual fallback.
 - CORS and embeds: CORS is intentionally permissive for the embed widget — review `server/index.ts` CORS settings before tightening.
 - Error handling: central error middleware in `server/index.ts` returns structured JSON errors; OpenAI-specific errors are managed by `server/openai/error-handler.ts`.

 ## How to extend or modify this domain
 - Add a route: create `server/routes/<domain>.ts` and export/register it via `server/routes/index.ts` so `registerRoutes()` picks it up.
 - Add validation: prefer Zod or similar for input and AI output validation; add schemas to `shared/` or `server/ai-response-schema.ts` and unit tests for parsers.
 - Test streaming: mock OpenAI streaming payloads to test `streaming-handler` and client behavior; include parse/fallback scenarios.
 - Webhooks and middleware: when adding middleware that inspects body, preserve raw body handling for `/api/webhook` to avoid signature breakage.

 ## Operational notes and assumptions
 - Dev vs Prod: Vite middleware for SSR runs only when `NODE_ENV === 'development'`; production uses prebuilt static files served by `server/vite.ts::serveStatic()`.
 - Required env: common env vars include `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, and storage credentials (GCP/AWS); missing keys may throw at startup for certain services.
 - Storage contract: `server/storage.ts` implements `IStorage` with many higher‑level helpers — changing its surface requires updating callers across routes and AI context builders.

 See per‑domain docs in this folder for detailed guidance (auth, openai, database, storage, billing, frontend, infra).
