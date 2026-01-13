[**rest-express**](../../../README.md)

***

[rest-express](../../../README.md) / [shared/schema](../README.md) / insertWebsiteContentSchema

# Variable: insertWebsiteContentSchema

> `const` **insertWebsiteContentSchema**: `ZodObject`\<`Omit`\<\{ `content`: `ZodString`; `contentType`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `embedding`: `ZodOptional`\<`ZodNullable`\<`ZodArray`\<`ZodNumber`, `"many"`\>\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `title`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `url`: `ZodString`; `websiteSourceId`: `ZodNumber`; `wordCount`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; \}, `"id"` \| `"createdAt"` \| `"embedding"`\>, `"strip"`, `ZodTypeAny`, \{ `content`: `string`; `contentType?`: `string` \| `null`; `title?`: `string` \| `null`; `url`: `string`; `websiteSourceId`: `number`; `wordCount?`: `number` \| `null`; \}, \{ `content`: `string`; `contentType?`: `string` \| `null`; `title?`: `string` \| `null`; `url`: `string`; `websiteSourceId`: `number`; `wordCount?`: `number` \| `null`; \}\>

Defined in: [shared/schema.ts:304](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/shared/schema.ts#L304)
