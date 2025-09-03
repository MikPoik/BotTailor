/**
 * JSON Schema definition for OpenAI structured responses
 * Used to ensure consistent multi-bubble response format
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
                "image",
                "quickReplies",
                "form",
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