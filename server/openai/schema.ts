/**
 * Canonical OpenAI response schema for chat widget and assistants.
 *
 * Responsibilities:
 * - Defines Zod schemas for all AI message types (bubble, menu, quick reply, etc.).
 * - Exports AIResponse, AIMessage, and related types for use across server and client.
 * - Documents contract for streaming and non-streaming OpenAI output.
 *
 * Constraints & Edge Cases:
 * - All schema changes must be coordinated with response-generator.ts, response-parser.ts, and client types.
 * - Schema must match client-side expectations (see shared/schema.ts and docs/agents/openai.md).
 * - Backwards-incompatible changes require migration and versioning consideration.
 */
/**
 * Canonical JSON Schema for OpenAI structured responses (multi-bubble format).
 *
 * Responsibilities:
 * - Defines the contract for all OpenAI model outputs (see server/ai-response-schema.ts for Zod runtime validation).
 * - Ensures consistent shape for streaming and non-streaming AI responses (bubbles, message types, metadata).
 * - Used for model prompt/response validation and regeneration logic.
 *
 * Constraints & Edge Cases:
 * - Any change here requires coordinated updates to response-parser.ts and UI consumers.
 * - All messageType and metadata fields must be kept in sync with server/ai-response-schema.ts and client consumers.
 */
export const MULTI_BUBBLE_RESPONSE_SCHEMA = {
  name: "multi_bubble_response",
  schema: {
    type: "object",
    properties: {
      bubbles: {
        type: "array",
        items: {
          type: "object",
          properties: {
            messageType: {
              type: "string",
              enum: [
                "text",
                "card",
                "menu",
                "multiselect_menu",
                "rating",
                "image",
                "quickReplies",
                "form",
                "form_submission",
                "system",
              ],
            },
            content: {
              type: "string",
            },
            metadata: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                imageUrl: { type: "string" },
                buttons: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      text: { type: "string" },
                      action: { type: "string" },
                      payload: {},
                    },
                    required: ["id", "text", "action"],
                  },
                },
                options: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      text: { type: "string" },
                      icon: { type: "string" },
                      action: { type: "string" },
                      payload: {},
                    },
                    required: ["id", "text", "action"],
                  },
                },
                quickReplies: {
                  type: "array",
                  items: { type: "string" },
                },
                formFields: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      label: { type: "string" },
                      type: {
                        type: "string",
                        enum: ["text", "email", "textarea"],
                      },
                      placeholder: { type: "string" },
                      required: { type: "boolean" },
                      value: { type: "string" },
                    },
                    required: ["id", "label", "type"],
                  },
                },
                submitButton: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    text: { type: "string" },
                    action: { type: "string" },
                    payload: {},
                  },
                  required: ["id", "text", "action"],
                },
              },
            },
          },
          required: ["messageType", "content"],
        },
      },
    },
    required: ["bubbles"],
  },
} as const;
