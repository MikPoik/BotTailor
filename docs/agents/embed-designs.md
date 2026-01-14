# Embed-Designs

Concise reference for embeddable design payloads, server-side embed services, and the runtime contract used by third-party hosts to embed the widget.

## Domain Overview

This domain focuses on the server and runtime pieces that make a chat UI design embeddable by external host pages. It covers the payloads produced for embeds, the `public/embed.js` integration surface, ownership and access rules for protected payloads, and the small runtime `client/src/components/embed/` uses to hydrate the widget. It is distinct from the `UI Designer` domain which owns the editor UX and artifact serialization.

## Key modules and files

- `server/embed-service.ts` — Primary server logic for creating, fetching, and rendering embed payloads; enforces ownership and `embedKey`/token validation.
- `public/embed.js` — Ship-to-host script that initializes the widget on third‑party pages and negotiates config with the host (`window.ChatWidgetConfig`).
- `public/embed.css` — Styles shipped alongside `public/embed.js` to ensure visual isolation and sensible defaults.
- `client/src/components/embed/` — Runtime React components used inside the embed shell (launcher, iframe bridge, minimal hydration components for the host context).
- `shared/schema.ts` — DB schema entries relevant to embed designs: `embedDesign`, `embedDesignComponents`, and related fields used by `server/embed-service.ts`.
- `server/routes/embeds.ts` (or routes under `server/routes/`) — Public API routes for fetching embed payloads (e.g. `GET /api/public/chatbot/{userId}/{chatbotGuid}`) and host-facing endpoints.
- `server/ui-designer-service.ts` — (Related) persistence and artifact operations used by the designer; `Embed-Designs` reads artifact shapes from here but is a separate operational surface.

## Main types and contracts

- Embed payload (server → client): an object with `embedId`, `design` (artifact or reference), `version`, `chatbotConfig`, `theme` (colors), `settings` (enableSearch, defaultCategory), and `publicAssets` (URLs). The server returns `id`/`version` and may inline components for public payloads.
- Access tokens/keys: `embedKey` or signed tokens used to gate protected designs. Server validates ownership (`userId`) before returning a protected payload.
- Host init config (`window.ChatWidgetConfig`): `apiUrl`, `sessionId` (optional), `widgetId`/`embedId`, styling overrides (`primaryColor`, `backgroundColor`, `textColor`), and optional `embedKey` for protected designs.
- DB model fields (not exhaustive): `chatbotConfigId`, `userId`, `embedId` (UUID), `name`, `designType`, `primaryColor`, `welcomeMessage`, `isActive`, `customCss`, and `embedDesignComponents` with `componentName`, `isVisible`, `componentOrder`.

Cross-domain contract note: when the `UI Designer` artifact schema changes (component shapes, field names), both `server/embed-service.ts` and `public/embed.js` must be updated in lockstep.

## Important flows and edge cases

- Public embed fetch: host requests the public endpoint (no `embedKey`) → server returns lightweight payload optimized for web delivery (may omit private data and inline only visible components).
- Protected embed fetch: host/iframe includes `embedKey` or signed token → server validates token + `userId` ownership → returns full payload (including private assets or secrets withheld from public payloads).
- Initialization: `public/embed.js` reads host config (from global or query), requests the embed payload, and hydrates the embed inside an iframe or shadow DOM to avoid CSS collisions.
- Concurrency & versions: server returns `version`/`ETag` for embed designs. The client or host may cache payloads; optimistic concurrency should be observed when updating designs via the editor.

Edge cases and non‑obvious behavior:
- CORS & postMessage: embed usage across origins requires correct CORS on API endpoints and robust `postMessage` handling for host↔widget comms.
- Asset hosting: public embeds should use stable CDN URLs; private assets must be gated by signed URLs or served only to authenticated requests.
- Migration risk: changing component props (e.g., renaming `welcomeMessage` → `greeting`) requires a migration path—old embeds must be tolerated or a versioned payload returned.
- Frame isolation: to avoid CSS leakage on host pages, prefer an iframe or Shadow DOM; `public/embed.js` should fallback gracefully on restrictive CSPs.

## How to extend or modify this domain

- Add server endpoints: add route files under `server/routes/` and register them in the route index. Keep public endpoints under `/api/public/*`.
- Update payload shape: modify `server/embed-service.ts` and update `public/embed.js` accordingly. Add migration logic in `server/ui-designer-service.ts` if the underlying artifact schema changes.
- Add embed UI components: place new components in `client/src/components/embed/` and keep them minimal — the embed surface should remain lean for fast load times.
- Testing & validation: run `tsc --noEmit` to validate types, then start the dev server and exercise `public/embed.js` on a test host page that simulates cross‑origin loading.


- Typical pitfalls: forgetting to update `public/embed.js` when changing component props; exposing private assets in public payloads; breaking CORS or webhook raw-body ordering that affects embed endpoints.

Summary: This domain groups the small but operationally sensitive pieces that make a design embeddable — server payloads, host init contract, runtime embed script, and ownership/access controls. Treat it as the place to change anything that affects third‑party hosts embedding the widget.
