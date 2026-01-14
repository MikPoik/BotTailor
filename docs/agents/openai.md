# OpenAI Domain Overview

This domain implements AI orchestration for chat and structured responses: building system prompts and RAG context, calling the OpenAI client (streaming and non‑streaming), parsing/validating model output into the app's multi‑bubble format, and applying regeneration/fallback logic.

All implementation lives under `server/openai/` with cross‑cutting schema and response types in `server/ai-response-schema.ts` and `server/openai/schema.ts`.

## Key modules and files
- `server/openai/client.ts` — singleton OpenAI client and `isOpenAIConfigured()` helper (requires `OPENAI_API_KEY`).
- `server/openai/context-builder.ts` — constructs `systemPrompt` including website RAG context and active survey context; exposes `buildCompleteSystemPrompt()` and helpers.
- `server/openai/schema.ts` — canonical JSON schema `MULTI_BUBBLE_RESPONSE_SCHEMA` used in `response_format: { type: "json_schema" }` requests.
- `server/openai/response-generator.ts` — non‑streaming generation endpoints (survey and prompt assistants, multi‑bubble generation); uses `parseOpenAIResponse()` for final parsing.
- `server/openai/streaming-handler.ts` — streaming generator `generateStreamingResponse()` that yields bubble events (`StreamingBubbleEvent`) and implements regeneration, validation, and salvage flows.
- `server/openai/response-parser.ts` — best‑effort and strict parsing utilities (`parseStreamingContent`, `parseOpenAIResponse`, `isBubbleComplete`, `detectJsonBoundary`) and normalization helpers.
- `server/openai/context-builder.ts` — builds website and survey contexts used in `systemPrompt`.
- `server/ai-response-schema.ts` — shared TypeScript types and small helpers referenced across the domain.

## Main types and contracts
- AIResponse (multi‑bubble format): top‑level object `{ bubbles: Array<{ messageType, content, metadata? }>} ` — validated via `AIResponseSchema` and `MULTI_BUBBLE_RESPONSE_SCHEMA`.
- `ConversationMessage` / `ChatConfig`: small interfaces in `response-generator.ts` used by generator functions.
- `StreamingBubbleEvent`: yielded by `generateStreamingResponse()`; event shapes: `{ type: "bubble"|"complete", bubble?, content?, messageType?, metadata? }`.
- Response formats used with OpenAI:
	- `response_format.type = "json_schema"` (streaming or non‑streaming) expected to produce the multi‑bubble JSON per `MULTI_BUBBLE_RESPONSE_SCHEMA`.
	- `response_format.type = "json_object"` (used in some non‑stream calls, e.g., survey helper).

Assumption: code expects the model to return either complete JSON objects or streamable JSON that can be reassembled; changing schema or model behavior requires coordinated parser and validator updates.

## Important flows and edge cases
- Streaming vs non‑streaming:
	- `generateStreamingResponse()` streams deltas from OpenAI, accumulates them, uses `detectJsonBoundary()` to decide parsing points, and yields complete bubbles as they become available. It intentionally skips menu/multiselect bubbles during incremental yields and emits them in the final pass to ensure completeness.
	- Non‑streaming generators (`generateMultiBubbleResponse`, `generatePromptAssistance`, etc.) wait for a single completion and then call `parseOpenAIResponse()`.
- Parsing and normalization:
	- `parseStreamingContent()` uses a best‑effort JSON parser; `parseOpenAIResponse()` performs strict JSON.parse → normalization → validation via `AIResponseSchema`.
	- `response-parser.ts` normalizes `messageType` variants (e.g., `multiselectMenu` → `multiselect_menu`) and implements `isBubbleComplete()` per message type rules (menus must include `metadata.options`, forms require `formFields`, etc.).
- Validation, regeneration, and salvage:
	- After final parse, `streaming-handler` runs `validateSurveyMenuRequirements()` and `validateDynamicContent()`; if validation fails and `needsRegeneration` is true, it builds an enhanced prompt and retries (non‑streaming) to regenerate a corrected response.
	- If parsing fails, `error-handler` provides salvage attempts; a final textual fallback bubble is emitted if salvage fails.
- Operational details and protections:
	- The client is a singleton and throws if `OPENAI_API_KEY` is missing (`client.ts`).
	- Streaming has a small retry loop for API errors and enforces a per‑bubble delay to smooth UI updates.

## How to extend or modify this domain
- Adding new message types:
	1. Update `MULTI_BUBBLE_RESPONSE_SCHEMA` in `server/openai/schema.ts`.
	2. Update `isBubbleComplete()` and `normalizeType()` in `server/openai/response-parser.ts` to enforce type‑specific invariants.
	3. Update `streaming-handler.ts` if the type affects streaming behavior (e.g., whether to delay or skip during incremental yields).
- Changing prompt/context behavior:
	- Modify `buildCompleteSystemPrompt()` in `server/openai/context-builder.ts`; note website RAG and survey context are injected here and may require storage access changes in `server/storage.ts`.
- Tests and validation:
	- Add unit tests for `response-parser` (normalization, `isBubbleComplete`) and `streaming-handler` (boundary detection, regeneration triggers). Mock OpenAI stream payloads for integration tests.

Non‑obvious warnings and assumptions
- Changing `MULTI_BUBBLE_RESPONSE_SCHEMA`, `AIResponseSchema`, or `isBubbleComplete()` can silently break downstream renderers — update parser + streaming logic and corresponding client expectations.
- The domain relies on `server/storage` for survey/session context checks; editing survey validation flows requires verifying `storage` interactions.
- Model behavior changes (tokenization, partial JSON emission, or different schema field names) require coordinated updates to `parseStreamingContent`, `detectJsonBoundary`, and the regeneration prompts.

Keep changes minimal and coordinate schema + parser updates together.
