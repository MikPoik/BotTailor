# Project: Enchanted Chat Widget

Full-stack AI-driven customer support ecosystem featuring embeddable widgets, RAG-powered assistants, and dynamic UI customization.

## Architecture & Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui.
  - **State**: TanStack Query (Server), custom hooks (`use-chat`, `useStreamingMessage`) for UI state.
  - **Routing**: `wouter` with sophisticated context detection (legacy vs. iframe embeds).
- **Backend**: Express.js (ESM), Node.js 20.
  - **Modular Routing**: Registration order is critical (Embeds -> Public -> Webhooks).
  - **AI Engine**: Advanced OpenAI integration (`server/openai/`) featuring multi-bubble parsing, validation, and structured output via `json_schema`.
- **Data**: Neon PostgreSQL via Drizzle ORM. Uses `pgvector` for semantic search.

## Core Features & Logic
- **UI Designer**: AI-powered home screen builder.
  - Generates `HomeScreenConfig` (JSON) via `/api/ui-designer/generate`.
  - Supports dynamic theme resolution (Embed Params > Designer Config > CSS Defaults).
  - Components: `header`, `topic_grid`, `quick_actions`, `footer`.
- **Streaming System**: Custom newline-prefixed JSON protocol.
  - Server emits: `bubble`, `complete`, `error` frames.
  - Client (`StreamingMessage.tsx`) handles interleaved text and interactive elements.
- **Rich Messaging**: JSON-defined bubble types: `card`, `menu`, `multiselect_menu`, `rating`, `form`, `quickReplies`, `image`, `text`.
- **RAG System**: Semantic search using `storage.searchSimilarContent` against chunked website data (OpenAI ada-002 embeddings).
- **Survey Engine**: Progressive JSON-defined questionnaires with branching logic (`conditionalFlow`) and AI validation.
- **Embed Designs & CTA**: 
  - Managed via `embed_designs` and `embed_design_components` tables.
  - Supports custom colors, UI component visibility, and persistent CTA configurations.
  - **Visual CTA Editor**: Located in `client/src/components/embed/cta-builder/`, allows building complex CTA views with nested components (badges, buttons, forms, etc.).

## Critical File Map
- `shared/schema.ts`: **Source of truth** for all DB, Zod schemas, and rich message contracts.
- `server/storage.ts`: IStorage interface implementation for all DB operations.
- `server/openai/`: Core AI logic (streaming, validation, regeneration, context building).
- `client/src/components/chat/`: Widget UI and message rendering logic.
- `client/src/components/embed/`: Runtime components for the embed shell (launcher, iframe bridge, and layout variants: `MinimalEmbed`, `CompactEmbed`, `FullEmbed`).
- `client/src/components/embed/embed-cta/`: UI engine for rendering and managing CTA views.
- `client/src/hooks/use-chat.ts`: Manages streaming state and message history.
- `public/embed.js`: Ship-to-host script that initializes the widget on 3rd-party pages.

## Implementation Details & Patterns
- **User Sync**: On login, `POST /api/ensure-user` syncs Neon Auth profiles to the `users` table.
- **Theme Priority**: 1. Embed Params (`--chat-primary-color`), 2. Designer Config (`embed_designs` or `homeScreenConfig`), 3. CSS Defaults.
- **Embed Logic**: `window.__EMBED_CONFIG__` (new design system) vs. `embedded=true` (legacy).
- **AI Validation**: Uses `survey-menu-validator.ts` and `dynamic-content-validator.ts` to ensure structured outputs meet constraints.

## Development Rules
- **Schema First**: Update `shared/schema.ts` before any feature work. This is the canonical contract.
- **JSON Contracts**: Any change to message/config JSON must be synced across client (`use-chat.ts`, components) and server (`streaming-handler.ts`, `response-parser.ts`).
- **Validation**: AI responses MUST be validated via Zod schemas before being used or stored.
- **Theming**: Always use HSL variables and `resolveColors` logic for visual consistency.
- **Error Handling**: Use `server/openai/error-handler.ts` for AI salvage/fallback logic.

## Next Agent Checklist
1. **Define Contract**: Start in `shared/schema.ts`.
2. **Sync Server**: Update `server/openai/` parsers, validators, and routes.
3. **Sync Client**: Update `client/src/hooks/use-chat.ts` and UI components in `client/src/components/`.
4. **Verify Embeds**: Test changes in both direct access and iframe modes using `public/embed.js`.
5. **Check Middleware**: Webhook routes must handle raw bodies before `express.json()`.
