# UI Designer & Embeds

Concise reference for the UI Designer runtime, artifact format, and the embeddable widget surface used by third-party hosts.

## Purpose
Documents how designer artifacts are saved/loaded, the embed configuration contract, and operational considerations for cross-origin embeds.

## Core files
- `client/src/components/ui-designer/` — React runtime and editor components.
- `client/src/components/embed/` — composable embed components consumed by the widget.
- `server/ui-designer-service.ts` — server endpoints that persist and version designer artifacts.
- `server/embed-service.ts` — prepares embeddable payloads and enforces host integration rules.
- `public/embed.js` / `public/embed.css` — ship-to-host script and styles for third-party embedding.

## Artifact & embed contracts
- Designer artifact: stored JSON blob (layout, component props, metadata, version). Server endpoints accept and return artifact IDs and last-modified/version info.
- Embed config: host page provides a minimal config object (API origin, `widgetId`, optional auth token or `embedKey`, and styling overrides). The widget loads config from a global or via query/init call.
- Security modes:
	- Public embeds: show non-sensitive content; assets may be served from `public/`.
	- Protected embeds: require an `embedKey` or signed token; server verifies before returning private payloads.

## Flows & edge cases
- Cross-origin: hosts must set appropriate iframe attributes/CSP and the server must set CORS on any API endpoints the embed calls. `postMessage` is used for host↔widget comms where needed.
- Persistence: the service provides idempotent save endpoints and returns artifact `version`/ETag to support optimistic concurrency.
- Backwards compatibility: `public/embed.js` is a stable surface—changing config keys or message types requires a migration path and versioning.

## Extending the designer or embed
- Add components under `client/src/components/ui-designer/` and extend the server API in `server/ui-designer-service.ts` to persist new fields.
- When changing embed payloads, update `server/embed-service.ts`, `public/embed.js`, and document the migration in `docs/agents/ui-designer.md` so integrators can adapt.

## Testing recommendations
- Unit: component tests for editor UI and serialization logic.
- Integration: host page that loads `public/embed.js` and validates config negotiation, authentication, and message passing.

## Quick operational checks
- Verify `public/embed.js` initialization: it should accept the same config keys documented here and handle missing optional fields gracefully.
- Confirm server returns artifact `id`, `version`, and `url`/payload shape expected by the client.

Concrete code references (extracted from the codebase):

- Artifact root fields:
	- `version` (string)
	- `components` (array of component objects)
	- `theme` (object)
	- `settings` (object)

- Component required fields (every component): `id`, `type`, `order`, `visible`, `props`.

- Component types & props (examples from `server/ui-designer-service.ts`):
	- `header` props: `title`, `subtitle`, `topics` (array)
	- `category_tabs` props: `categories` (string[]), `topics`
	- `topic_grid` props: `topics` where each topic has `id`, `title`, `description`, `icon`, `category`, `message`, `actionType` ("message"|"survey"|"custom"), `surveyId` (number), `popular` (boolean)
	- `quick_actions` props: `actions` where each action has `id`, `title`, `description`, `action`, `actionType`, `surveyId`

- Theme fields preserved by the modifier flow: `primaryColor`, `backgroundColor`, `textColor` (modifier code preserves unspecified theme properties).

- Settings keys shown in defaults: `enableSearch`, `enableCategories`, `defaultCategory`.

- Embed config keys accepted by the client (`public/embed.js` / `window.ChatWidgetConfig`):
	- `apiUrl` (required)
	- `sessionId` (optional; server may generate if missing)
	- `position`, `primaryColor`, `backgroundColor`, `textColor`, `zIndex`
	- `chatbotConfig` is populated at runtime when fetching `/api/public/chatbot/{userId}/{chatbotGuid}`

- URL & API patterns used by the embed script:
	- Widget URL shape: `/widget/{userId}/{chatbotGuid}` (embed.js parses this pattern)
	- Public config endpoint: `GET /api/public/chatbot/{userId}/{chatbotGuid}`

- Embed design server-side surface (`server/embed-service.ts`):
	- `createEmbedDesign(input: CreateEmbedDesignInput)` inserts fields: `chatbotConfigId`, `userId`, `embedId` (UUID), `name`, `description`, `designType`, `primaryColor`, `backgroundColor`, `textColor`, `welcomeMessage`, `welcomeType`, `inputPlaceholder`, `showAvatar`, `showTimestamp`, `headerText`, `footerText`, `ctaConfig`, `hideBranding`, `customCss`, `isActive`.
	- Ownership and protected access enforced by `userId` checks in `getEmbedDesignById`, `updateEmbedDesign`, and `deleteEmbedDesign`.
	- Default components created for new designs: `welcome_section`, `chat_messages`, `input_field`, `feedback_buttons`, `typing_indicator` (stored in `embedDesignComponents` with `componentName`, `isVisible`, `componentOrder`).

