
# Frontend (UI) Overview

Client is a Vite + React 18 app (CSR + optional SSR) providing the UI, embed widget runtime, and client‑side integrations (auth, streaming chat, embeds, UI designer). Code lives under `client/src/`; built assets and embed runtime live in `public/`.

## Key modules and files
- `client/src/main.tsx` — app bootstrap: hydrates SSR content if present or mounts CSR root; wraps providers (`QueryClient`, `Theme`, `Tooltip`).
- `client/src/entry-server.tsx` — server SSR entry: `generateHTML`, `render`, and `generateMetaTags` used by `server/vite.ts` for SSR in dev/prod.
- `client/src/App.tsx` — top-level app: routing, embed detection, consent/analytics logic, and provider wiring; detects embed contexts via `window.__CHAT_WIDGET_CONFIG__` and `window.__EMBED_CONFIG__`.
- `client/src/components/` — UI primitives (navbar, footer, chat widget, embed UI, UI designer components).
- `client/src/hooks/` — important hooks: `useChat` (streaming and non‑streaming chat API), `useAuth`, `useEmbedConfig`, `useStreamingMessage` helpers.
- `client/src/lib/` — utilities: `apiRequest`, `queryClient`, auth helpers, and integrations (Stack, analytics).
- `public/embed.js` & `public/embed.css` — embeddable widget loader and styling; embed host pages provide config via global variables or query params.

## Main types and contracts
- Shared types: use `shared/` types (e.g., `Message`, `ChatSession`) exported from `shared/schema.ts`; UI should import these rather than retyping shapes.
- Chat contract (client ↔ server):
	- Session creation: `POST /api/chat/session` (used by `useChat.initializeSession`).
	- Messages: `GET /api/chat/:sessionId/messages` (initial message load).
	- Streaming: `POST /api/chat/:sessionId/messages/stream` — client reads newline-delimited `data: {...}` frames (hook expects JSON objects with `type: 'bubble'|'complete'|'error'|'limit_exceeded'|'end'`, and `message` payloads). `useChat.sendStreamingMessage()` decodes, appends bubbles to cache, and handles completion/limits/errors.
	- Non‑stream fallback: `POST /api/chat/:sessionId/messages` returns final messages array.
- Embed config sources:
	- Legacy embed: `window.__CHAT_WIDGET_CONFIG__` (legacy embeddable widget).
	- New embed designs: `window.__EMBED_CONFIG__` (iframe embed with `apiUrl` override and layout options).

## Important flows and edge cases
- SSR hydration: `main.tsx` hydrates when server injected HTML exists; `entry-server.tsx` must export `generateHTML`/`generateMetaTags` for SSR to work.
- Embed modes: app detects embed via query param `embedded=true` or global window configs; embed mode hides chrome (navbar/footer), uses absolute `apiUrl` if provided, and applies stricter fallbacks for storage and analytics.
- Streaming parsing and optimistic UI:
	- `useChat` implements optimistic user messages, then opens a fetch stream and reads with a `ReadableStream` reader.
	- Stream lines start with `data: ` and carry JSON; the client keeps a buffer for partial chunks and safely ignores unparseable lines.
	- Bubbles are deduplicated by `id`; menu/multiselect handling and limit signals (`limit_exceeded`/`chatbot_inactive`) set read‑only state.
- Storage fallbacks: `useChat` uses guarded access to `sessionStorage`/`localStorage` to support sandboxed embed hosts.
- Analytics & consent: `App.tsx` only loads GA when cookie consent is `accepted` and not in embed mode.

## How to extend or modify this domain
- Add pages/components: place under `client/src/pages/` or `client/src/components/` and register routes in `App.tsx`.
- Change streaming framing: coordinate server `server/openai/streaming-handler.ts` and client `useChat` parsing logic; update tests that mock stream payloads.
- Embeds: update `public/embed.js` and ensure backward compatibility with `__CHAT_WIDGET_CONFIG__` and `__EMBED_CONFIG__`; prefer `apiUrl` overrides for cross‑origin embed hosts.
- Tests: unit test `useChat` streaming behavior with mocked `ReadableStream` and integration tests that simulate server streaming frames (Stripe CLI‑style approach).

Keep client contracts (message shapes, stream frame types, embed globals) stable; any change requires simultaneous client+server updates and new integration tests.
