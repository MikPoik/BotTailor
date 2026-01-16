# Project: Enchanted Chat Widget

Full-stack React/Express application for embeddable customer support chat widgets.

## Architecture
- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Wouter.
- **Backend**: Express.js, Node.js (ESM), Drizzle ORM, Neon PostgreSQL.
- **Key Services**: OpenAI (RAG with pgvector), Stripe, Stack Auth.
- **Communication**: HTTP Polling for real-time chat updates.

## File Structure
- `client/src/components/chat`: Core widget UI (bubbles, rich messages, forms).
- `client/src/components/embed`: New iframe-based design and CTA builders.
- `server/routes/`: Modularized API endpoints (auth, chatbots, chat, surveys).
- `server/storage.ts`: Centralized DatabaseStorage implementing `IStorage`.
- `shared/schema.ts`: Drizzle tables and Zod validation schemas.

## Guidelines for Agent
- **Data Model**: Always update `shared/schema.ts` first.
- **Storage**: Use `IStorage` interface in `server/storage.ts`.
- **API**: Keep `server/routes/*.ts` thin; delegate logic to services.
- **UI**: Use `shadcn/ui` components and `lucide-react` icons.
- **Embeds**: Support legacy widget and new iframe designs (distinguished by `__EMBED_CONFIG__`).

## Recent Features
- **Surveys**: Interactive question flows within chat.
- **CTA Builder**: Visual editor for designing call-to-action components.
- **Embed Designs**: Customizable iframe variants (Minimal, Compact, Full).
- **Theming**: Color priority: Embed Params > UI Designer > Default CSS.
