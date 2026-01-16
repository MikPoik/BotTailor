# Project: BotTailor Chat Widget Platform

Full-stack AI-driven customer support ecosystem featuring embeddable widgets, RAG-powered assistants, and dynamic UI customization.

## Quick Start for New Agents

1. **Read this file first** for architecture overview and rules
2. **Consult `/docs/agents/*.md`** for detailed domain-specific documentation:
   - `architecture.md` - Full runtime and module map
   - `openai.md` - AI orchestration, streaming, parsing, validation
   - `database.md` - Schema, Drizzle ORM, migrations
   - `frontend.md` - React/Vite client, hooks, embed modes
   - `auth.md` - Neon auth header-based authentication
   - `billing.md` - Stripe subscriptions and webhooks
   - `embed-designs.md` - Embeddable widget payloads and host integration
   - `ui-designer.md` - Designer artifacts and component contracts
   - `survey-designer.md` - Survey creation, validation, analytics
   - `storage.md` - Uploads, storage adapters, presigned URLs
   - `api.md` - HTTP routes, middleware, error handling
   - `infra.md` - Dockerfile, Fly.io, deployment

## Architecture & Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui
  - **State**: TanStack Query (Server), custom hooks (`use-chat`, `useStreamingMessage`) for UI state
  - **Routing**: `wouter` with sophisticated context detection (legacy Widget vs. iframe embeds)
  - **SSR**: Optional SSR via `client/src/entry-server.tsx` (exports `generateHTML`, `render`, `generateMetaTags`)
- **Backend**: Express.js (ESM), Node.js 20
  - **Modular Routing**: Registration order is critical (Embeds -> Public -> Webhooks)
  - **AI Engine**: Advanced OpenAI integration (`server/openai/`) featuring multi-bubble parsing, validation, and structured output via `json_schema`
- **Data**: Neon PostgreSQL via Drizzle ORM. Uses `pgvector` for semantic search (1536 dims, text-embeddings)
- **Auth**: Header-based Neon auth (`x-stack-user-id` header) with lazy user creation
- **Billing**: Stripe-backed subscriptions with webhook handlers at `/api/webhook`

## Core Features & Logic
 - **Chat Widget System**: Runtime React application serving as the guest-facing interface: `/client/components/chat/widget`.
 - Supports multiple layout variants: `Desktop`, `Mobile`.
 - Implements session management and message synchronization.
 - **UI Designer**: AI-powered home screen builder
  - Generates `HomeScreenConfig` (JSON) via `/api/ui-designer/generate`
  - Supports dynamic theme resolution (Embed Params > Designer Config > CSS Defaults)
  - Components: `header`, `topic_grid`, `quick_actions`, `footer`, `category_tabs`
- **Streaming System**: Custom newline-prefixed JSON protocol
  - Server emits: `bubble`, `complete`, `error`, `limit_exceeded`, `end` frames
  - Client (`StreamingMessage.tsx`) handles interleaved text and interactive elements
- **Rich Messaging**: JSON-defined bubble types: `card`, `menu`, `multiselect_menu`, `rating`, `form`, `quickReplies`, `image`, `text`
- **RAG System**: Semantic search using `storage.searchSimilarContent` against chunked website data
- **Survey Engine**: Progressive JSON-defined questionnaires with branching logic (`conditionalFlow`) and AI validation
- **Embed Designs & CTA**: 
  - Managed via `embed_designs` and `embed_design_components` tables
  - Supports custom colors, UI component visibility, and persistent CTA configurations
  - **Visual CTA Editor**: Located in `client/src/components/embed/cta-builder/`

## Critical File Map

| File/Directory | Purpose |
|----------------|---------|
| `shared/schema.ts` | **Source of truth** for all DB schemas, Zod schemas, and rich message contracts |
| `server/storage.ts` | IStorage interface implementation for all DB operations |
| `server/db.ts` | Neon serverless pool + Drizzle client |
| `server/openai/` | Core AI logic (streaming, validation, regeneration, context building) |
| `server/openai/schema.ts` | `MULTI_BUBBLE_RESPONSE_SCHEMA` for structured AI output |
| `server/openai/response-parser.ts` | JSON parsing, normalization, `isBubbleComplete()` |
| `server/openai/streaming-handler.ts` | Streaming generator with regeneration/salvage logic |
| `server/neonAuth.ts` | Auth middleware (`isAuthenticated`, `neonAuthMiddleware`) |
| `server/routes/subscription.ts` | Stripe billing routes and webhook handler |
| `client/src/components/chat/` | Widget UI and message rendering logic |
| `client/src/components/embed/` | Runtime components for embed shell |
| `client/src/hooks/use-chat.ts` | Manages streaming state and message history |
| `public/embed.js` | Ship-to-host script that initializes widget on 3rd-party pages |

## Implementation Details & Patterns

- **User Sync**: On login, `POST /api/ensure-user` syncs Neon Auth profiles to the `users` table
- **Theme Priority**: 1. Embed Params (`--chat-primary-color`), 2. Designer Config, 3. CSS Defaults
- **Embed Logic**: `window.__EMBED_CONFIG__` (new design system) vs. `embedded=true` (Widget system)
- **AI Validation**: Uses `survey-menu-validator.ts` and `dynamic-content-validator.ts` to ensure structured outputs
- **Webhook Raw Body**: `/api/webhook` routes require raw body for Stripe signature verification - middleware ordering matters
- **CORS**: Permissive CORS enabled for embed widget cross-origin usage

## Development Rules

1. **Schema First**: Update `shared/schema.ts` before any feature work. This is the canonical contract.
2. **JSON Contracts**: Any change to message/config JSON must be synced across client (`use-chat.ts`, components) and server (`streaming-handler.ts`, `response-parser.ts`).
3. **Validation**: AI responses MUST be validated via Zod schemas before being used or stored.
4. **Theming**: Always use HSL variables and `resolveColors` logic for visual consistency.
5. **Error Handling**: Use `server/openai/error-handler.ts` for AI salvage/fallback logic.
6. **Auth**: Protected routes must use `isAuthenticated` middleware.
7. **Webhooks**: Mount at `/api/webhook` and preserve raw body parsing before `express.json()`.

## Agent Checklist

1. **Read Domain Docs**: Start with `/docs/agents/` files relevant to your task
2. **Define Contract**: Update `shared/schema.ts` for any new types
3. **Sync Server**: Update `server/openai/` parsers, validators, and routes
4. **Sync Client**: Update `client/src/hooks/use-chat.ts` and UI components
5. **Check Middleware**: Webhook routes must handle raw bodies before `express.json()`

## User Preferences

- Agent must alway rephrase my prompt to output-based-goal
- Use kebab-case for file naming convention
- Maintain modular design
