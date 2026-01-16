# Project: Enchanted Chat Widget

Full-stack React/Express application for embeddable customer support chat widgets with AI-driven RAG and survey capabilities.

## Architecture
- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui.
  - **Routing**: `wouter` with a logic-heavy `client/src/App.tsx` that handles legacy vs. new embed contexts.
  - **State**: `TanStack Query` for server state, custom hooks for widget logic (`use-chat.ts`, `useStreamingMessage.ts`).
  - **Auth**: `Stack Auth` integrated with a backend sync endpoint (`/api/ensure-user`).
- **Backend**: Express.js (ESM), Node.js 20.
  - **Modular Routes**: Managed in `server/routes/index.ts`. Registration order is critical (Embeds > Public > Webhooks).
  - **AI Engine**: Comprehensive OpenAI integration in `server/openai/` handling streaming, RAG via `pgvector`, and dynamic CTA generation.
  - **Storage**: `DatabaseStorage` in `server/storage.ts` implementing a rigid `IStorage` interface.
- **Database**: Neon PostgreSQL via `Drizzle ORM`. Uses `vector` types for semantic search.

## Critical File Map
- `shared/schema.ts`: Source of truth for DB tables and Zod schemas.
- `server/storage.ts`: All DB interactions must go through the `DatabaseStorage` class.
- `server/routes/`: Separate files for `auth`, `chat`, `surveys`, `embeds`, `websites`.
- `client/src/components/chat/`: Legacy widget UI components.
- `client/src/components/embed/`: New iframe design system and `cta-builder`.
- `client/src/hooks/useAuth.ts`: Bridge between Stack Auth and local database state.

## Implementation Guidelines
- **Database First**: Any new feature starts with a schema update in `shared/schema.ts`.
- **Type Safety**: Use exported types from schema (`User`, `ChatbotConfig`, etc.) throughout the stack.
- **API Pattern**: Routes validate with Zod → Call `storage` methods → Return typed responses.
- **UI Consistency**: Follow shadcn/ui patterns. Use HSL variables in `index.css` for theming.
- **Polling**: Chat uses HTTP polling for message sync. Do not attempt to implement WebSockets without explicit instruction.
- **Embed Logic**: Distinguish contexts using `window.__EMBED_CONFIG__` (new) or `embedded=true` (legacy).

## Key Workflows
1. **User Sync**: On login, the frontend calls `POST /api/ensure-user` to sync Stack Auth profiles to the `users` table.
2. **RAG Search**: AI responses utilize `storage.searchSimilarContent` to fetch relevant website chunks before generating answers.
3. **Survey Flow**: Managed via `surveySessions` table; tracks progress and AI-driven transitions within the chat.
4. **CTA Builder**: A specialized editor for creating interactive components stored as JSON in `chatbotConfigs.homeScreenConfig`.

## Recent Architecture Decisions
- **Vector Search**: Using `pgvector` for semantic RAG instead of simple keyword search.
- **Modular Routing**: Switched to a decentralized route registration to prevent `server/routes.ts` bloat.
- **Theme Priority**: 1. Embed Params, 2. DB Config, 3. CSS Defaults.
- **Rich Messaging**: Supported types include `card`, `menu`, `rating`, `form`, and `multiselect`.
