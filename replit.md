# Project: Enchanted Chat Widget

Full-stack AI-driven customer support ecosystem featuring embeddable widgets, RAG-powered assistants, and dynamic UI customization.

## Architecture & Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui.
  - **State**: TanStack Query (Server), custom hooks (`use-chat`, `useStreamingMessage`) for UI state.
  - **Routing**: `wouter` with sophisticated context detection (legacy vs. iframe embeds).
- **Backend**: Express.js (ESM), Node.js 20.
  - **Modular Routing**: Registration order is critical (Embeds -> Public -> Webhooks).
  - **AI Engine**: Advanced OpenAI integration (`server/openai/`) featuring multi-bubble parsing and validation.
- **Data**: Neon PostgreSQL via Drizzle ORM. Uses `pgvector` for semantic search.

## Core Features & Logic
- **UI Designer**: AI-powered home screen builder.
  - Generates `HomeScreenConfig` (JSON) via `/api/ui-designer/generate`.
  - Supports dynamic theme resolution (Embed Params > Designer Config > CSS Defaults).
  - Components: `header`, `topic_grid`, `quick_actions`, `footer`.
- **Streaming System**: Custom newline-prefixed JSON protocol.
  - Server emits: `bubble`, `complete`, `error` frames.
  - Client (`StreamingMessage.tsx`) handles interleaved text and interactive elements.
- **Rich Messaging**: JSON-defined bubble types:
  - `card`: Image + Title + Actions.
  - `menu`: Single-choice select.
  - `multiselect_menu`: Multiple-choice with min/max constraints.
  - `rating`: Star/Number/Scale feedback.
  - `form`: Interactive field collection (text, email, textarea).
  - `quickReplies`: Floating action chips.
- **RAG System**: Semantic search using `storage.searchSimilarContent` against chunked website data.
- **Survey Engine**: Progressive JSON-defined questionnaires with branching logic and AI validation.

## Critical File Map
- `shared/schema.ts`: Source of truth for all DB and Zod schemas.
- `server/storage.ts`: IStorage interface implementation for all DB operations.
- `server/openai/`: Core AI logic (streaming, validation, regeneration).
- `client/src/components/chat/`: Widget UI and message rendering logic.
- `client/src/components/ui-designer/`: Dynamic home screen rendering engine.
- `client/src/hooks/use-chat.ts`: Manages streaming state and message history.

## Implementation Details & Patterns
- **User Sync**: On login, `POST /api/ensure-user` syncs Stack Auth profiles to the `users` table.
- **RAG Search**: AI responses fetch relevant website chunks via `storage.searchSimilarContent` before generating answers.
- **Survey Flow**: Managed via `surveySessions` table; tracks progress and AI-driven transitions.
- **Theme Priority**: 1. Embed Params (`--chat-primary-color`), 2. Designer Config, 3. CSS Defaults.
- **Message Types**: Support for `text`, `card`, `menu`, `multiselect_menu`, `rating`, `image`, `quickReplies`, `form`, and `form_submission`.
- **Embed Logic**: `window.__EMBED_CONFIG__` (new design system) vs. `embedded=true` (legacy widget).

## Development Rules
- **Schema First**: Update `shared/schema.ts` before any feature work.
- **JSON Contracts**: Any change to message/config JSON must be synced across client and server.
- **Validation**: AI responses are validated via `survey-menu-validator.ts` and `dynamic-content-validator.ts`.
- **Theming**: Always use HSL variables and `resolveColors` logic for visual consistency.
- **Error Handling**: Use `server/openai/error-handler.ts` for AI salvage/fallback logic.
- **Real-time**: Uses HTTP polling/streaming, not WebSockets.
