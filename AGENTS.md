## Widget & Embed System

### Overview
The embeddable chat widget is the core delivery mechanism for the platform. It supports both legacy and new (iframe-based) embed modes, with robust configuration, theming, and dynamic UI.

### Embed Detection & Modes
- **Legacy Mode:** Detected via `embedded=true` query param or `window.__CHAT_WIDGET_CONFIG__` global. Used for backward compatibility.
- **New Mode:** Detected via `window.__EMBED_CONFIG__` global. Supports advanced UI designer, theming, and layout.
- **Detection Logic:** Both client and server check for these globals/params to determine mode and config source. See `client/src/hooks/useEmbedConfig.ts` and `public/embed.js`.

### Configuration & Theming
- **Config Priority:** Theme and UI config are resolved in this order:
	1. **Embed Params** (e.g., `--chat-primary-color` CSS var, query params)
	2. **Designer Config** (from UI Designer, e.g., `homeScreenConfig`, `embedDesigns`)
	3. **CSS Defaults** (hardcoded fallback values)
- **Theme Application:** CSS variables are injected at the container level for isolation. See `useWidgetTheme.ts` and `useEmbedTheme`.
- **Dynamic UI:** Home screen and CTA layouts are generated as JSON (`HomeScreenConfig`, `CTAConfig`) and rendered dynamically.

### Streaming Protocol
- **Protocol:** Newline-prefixed JSON frames (`bubble`, `complete`, `error`, etc.) are streamed from the server. The client parses and renders these in real time.
- **Contract:** Any change to the streaming protocol must be reflected in both `server/openai/streaming-handler.ts` and client streaming hooks/components (e.g., `use-chat.ts`, `StreamingMessage.tsx`).

### Message Types & JSON Structure
- **Supported Types:** `text`, `card`, `menu`, `multiselect_menu`, `rating`, `image`, `quickReplies`, `form`, `form_submission`.
- **Rich Messaging:** Each type is defined in `shared/schema.ts` and rendered in `client/src/components/chat/`.
- **UI Designer Components:** Home screen supports `header`, `topic_grid`, `quick_actions`, `footer`, etc.

### Key Files
- `public/embed.js`: Loads and initializes the widget, merges config, injects CSS, and manages lifecycle in host pages.
- `client/src/hooks/useEmbedConfig.ts`: Reads config from window globals, fetches by embedId, and applies theme.
- `client/src/components/chat/`: All widget UI, message rendering, and portal logic.
- `client/src/index.css`: Widget-specific and embedded-mode CSS rules.

### Implementation Rules
- **Schema First:** All message/config changes must start in `shared/schema.ts`.
- **Contract Sync:** Any change to message or config JSON must be synced across client and server.
- **Theme Consistency:** Always use CSS variables and `resolveColors` logic for visual consistency.
- **Session Isolation:** Widget session state is isolated from the host app; see `chat-session-context.tsx` and `widgetQueryClient.ts`.
- **No Global Side Effects:** Theme and scroll logic must be container-scoped in embeds.
- **Testing:** Always test both legacy and new embed modes for any UI or contract change.

# Enchanted Chat Widget: AI Chat Platform — Agent Onboarding Guide


## Project Overview
This is a full-stack TypeScript monorepo for an embeddable AI chat widget. It features:
- **Frontend:** React 18 + Vite (SSR/CSR)
- **Backend:** Express (ESM)
- **Database:** Neon/Postgres with Drizzle ORM and pgvector for semantic search
- **AI:** OpenAI SDK with streaming, validation, and modular prompt/context logic
- **Key Features:** UI designer, RAG-powered assistants, dynamic UI, progressive surveys, file uploads, and subscription billing


## Core Features & Flows
- **Schema-First Contracts:** All message, survey, DB, and UI contracts are defined in `shared/schema.ts`. This is the canonical source for types, validation, and DB structure. **Always update this file first for any new type, field, or contract.**
- **Streaming System:** The server streams newline-prefixed JSON frames (types: `bubble`, `complete`, `error`, etc.) for chat. The client parses and renders these frames in real time. **If you change the streaming contract, update both `server/openai/streaming-handler.ts` and client streaming hooks.**
- **UI Designer:** AI generates `HomeScreenConfig` and `CTAConfig` JSON for widget layout; theme resolution is prioritized. All UI config is validated by Zod schemas in `schema.ts`.
- **Rich Messaging Contract:** `schema.ts` defines all message, bubble, and survey types. **Any change must be mirrored in server validators/parsers and client renderers/hooks.**
- **RAG (Retrieval-Augmented Generation):** Uses semantic search on website data before AI generation; results are validated and integrated into prompts. See `server/openai/context-builder.ts`.
- **Survey Engine:** JSON-driven, progressive, and branching surveys; sessions are stored and validated. Survey types and flows are defined in `schema.ts`.
- **Embeds & Widget Modes:** Supports new and legacy embed modes; relies on permissive CORS. Embed detection logic is in both client and server.
- **Auth & User Sync:** Neon-based auth/session middleware; user profiles are synced on login. See `server/neonAuth.ts` and `client/src/hooks/useAuth.ts`.
- **Uploads & Storage:** S3 and image processing via sharp; upload endpoints and storage abstraction in `server/storage.ts`.
- **Billing & Webhooks:** Stripe integration; webhook endpoints require raw request body and correct middleware order. See `server/index.ts` for middleware ordering.


## Key Files & Their Roles
- `shared/schema.ts`: **Canonical source for all contracts** (messages, surveys, DB schema, UI config, Zod validation). Update this first for any new type/field.
- `server/index.ts`: Main server entry, middleware ordering, Vite integration, CORS, webhook raw body handling.
- `server/openai/`: Modular AI logic (prompt/context building, streaming, parsing, validation, error handling). Extend/override here for custom AI flows.
- `client/src/hooks/use-chat.ts`, `client/src/hooks/use-streaming-message.tsx`: Chat logic and streaming hooks (client). **Must match server streaming contract.**
- `client/src/chat/`, `client/src/ui-designer/`: UI rendering, embed behavior, dynamic UI from JSON config.
- `server/storage.ts`, `server/db.ts`: Storage API and DB access patterns (S3, sharp, Drizzle ORM).
- `server/ui-designer-service.ts`: Server-side UI designer logic (AI-driven UI generation).
- `client/src/entry-server.tsx`, `client/src/main.tsx`: Client entry points for SSR/CSR. **Provider trees must match for hydration.**
- `public/embed.js`, `public/embed.css`: Public assets for widget embedding (legacy and new modes).
- `vite.config.ts`, `Dockerfile`, `fly.toml`: Build and deployment tooling.


## Conventions & Best Practices
- **Schema-first:** Update `shared/schema.ts` before implementing any message, survey, DB, or UI schema change. This is the single source of truth for all contracts.
- **Contract Sync:** **After updating `schema.ts`, update all server validators/parsers and client renderers/hooks to match.**
- **Streaming Contract:** If you change the streaming protocol (frame types, shape), update both `server/openai/streaming-handler.ts` and client streaming hooks.
- **Middleware Ordering:** Register webhook raw-body handler before `express.json()`; Vite dev middleware after API routes.
- **Provider Parity:** Ensure provider trees match between `entry-server.tsx` and `main.tsx` for SSR/CSR hydration.
- **Validation-first:** Always validate AI outputs using Zod validators before accepting/storing.
- **Reuse Hooks/Utilities:** Use hooks/lib, avoid ad-hoc global state.
- **No dist/ edits:** Do not edit or commit compiled artifacts.
- **CORS:** Do not change to strict without verifying embed compatibility.



## Troubleshooting
- **Streaming issues:** Ensure server emits newline-prefixed JSON frames; client parser matches format. Update both sides if contract changes.
- **Webhook signature failures:** Confirm `/api/webhook` uses `express.raw` before `express.json`.
- **Schema/validation errors:** Check `shared/schema.ts` and server/client validators for mismatches.
- **SSR hydration issues:** Provider trees must match between `entry-server.tsx` and `main.tsx`.
- **Testing:** Use Playwright with API mocks to avoid cost in CI.
- **Heavy data tasks:** Use sampled datasets in dev.


---

## Quickstart for Coding Agents

1. **Start with `shared/schema.ts`:** Define or update all new message, survey, DB, or UI types here. This is the canonical contract for the entire system.
2. **Sync Contracts:** After updating `schema.ts`, update all server-side validators/parsers and client-side renderers/hooks to match the new/changed types.
3. **Streaming Contract:** If you change the streaming protocol (frame types, JSON shape), update both `server/openai/streaming-handler.ts` and client streaming hooks (`use-chat.ts`, etc.).
4. **Provider Trees:** Ensure provider trees match between `client/src/entry-server.tsx` and `client/src/main.tsx` for SSR/CSR hydration.
5. **Validation:** Always validate AI outputs using Zod validators before accepting or storing them.
6. **Testing:** Add/extend tests for new flows. Use Playwright with API mocks for CI.
7. **Check Middleware:** For webhooks, ensure raw body parsing is before JSON parsing in `server/index.ts`.
8. **No dist/ edits:** Never edit or commit compiled artifacts.

## Checklist: Adding New Message/Survey Types or DB Fields

- [ ] Update/add type in `shared/schema.ts` (Zod + DB + API contract)
- [ ] Update server-side validators/parsers (e.g., `server/openai/response-parser.ts`)
- [ ] Update client-side renderers/hooks (e.g., `use-chat.ts`, UI components)
- [ ] Add/extend tests (unit, integration, Playwright)
- [ ] Update docs if needed
- [ ] Run `npm run check` and verify all tests pass

## OpenAI Service Modularity

- Extend/override AI prompt/context logic in `server/openai/` (see `context-builder.ts`, `response-generator.ts`, etc.).
- All AI output must be validated before use (see Zod schemas in `schema.ts`).
- RAG (retrieval-augmented generation) is handled in `context-builder.ts` and integrated into prompts.

---
For any feature change, **always start with `shared/schema.ts`**, then update server validators/parsers, then client renderers/hooks, and add tests. Run `npm run check`.