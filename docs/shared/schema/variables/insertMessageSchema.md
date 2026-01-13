[**rest-express**](../../../README.md)

***

[rest-express](../../../README.md) / [shared/schema](../README.md) / insertMessageSchema

# Variable: insertMessageSchema

> `const` **insertMessageSchema**: `ZodObject`\<\{ `content`: `ZodString`; `messageType`: `ZodDefault`\<`ZodEnum`\<\[`"text"`, `"image"`, `"audio"`, `"video"`, `"file"`, `"card"`, `"menu"`, `"multiselect_menu"`, `"rating"`, `"quickReplies"`, `"form"`, `"form_submission"`, `"system"`\]\>\>; `metadata`: `ZodDefault`\<`ZodRecord`\<`ZodString`, `ZodAny`\>\>; `sender`: `ZodEnum`\<\[`"user"`, `"bot"`, `"assistant"`\]\>; `sessionId`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `content`: `string`; `messageType`: `"form"` \| `"menu"` \| `"text"` \| `"audio"` \| `"video"` \| `"image"` \| `"system"` \| `"file"` \| `"card"` \| `"multiselect_menu"` \| `"rating"` \| `"quickReplies"` \| `"form_submission"`; `metadata`: `Record`\<`string`, `any`\>; `sender`: `"user"` \| `"bot"` \| `"assistant"`; `sessionId`: `string`; \}, \{ `content`: `string`; `messageType?`: `"form"` \| `"menu"` \| `"text"` \| `"audio"` \| `"video"` \| `"image"` \| `"system"` \| `"file"` \| `"card"` \| `"multiselect_menu"` \| `"rating"` \| `"quickReplies"` \| `"form_submission"`; `metadata?`: `Record`\<`string`, `any`\>; `sender`: `"user"` \| `"bot"` \| `"assistant"`; `sessionId`: `string`; \}\>

Defined in: [shared/schema.ts:278](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/shared/schema.ts#L278)
