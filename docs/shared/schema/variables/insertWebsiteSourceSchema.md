[**rest-express**](../../../README.md)

***

[rest-express](../../../README.md) / [shared/schema](../README.md) / insertWebsiteSourceSchema

# Variable: insertWebsiteSourceSchema

> `const` **insertWebsiteSourceSchema**: `ZodObject`\<`extendShape`\<`Pick`\<\{ `chatbotConfigId`: `ZodNumber`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `description`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `errorMessage`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `fileName`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `lastScanned`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `maxPages`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `sitemapUrl`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `sourceType`: `ZodOptional`\<`ZodString`\>; `status`: `ZodOptional`\<`ZodString`\>; `textContent`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `title`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `totalPages`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `"title"` \| `"url"` \| `"maxPages"` \| `"description"` \| `"chatbotConfigId"` \| `"sourceType"` \| `"textContent"` \| `"fileName"` \| `"sitemapUrl"`\>, \{ `sourceType`: `ZodDefault`\<`ZodEnum`\<\[`"website"`, `"text"`, `"file"`\]\>\>; `url`: `ZodOptional`\<`ZodString`\>; \}\>, `"strip"`, `ZodTypeAny`, \{ `chatbotConfigId`: `number`; `description?`: `string` \| `null`; `fileName?`: `string` \| `null`; `maxPages?`: `number` \| `null`; `sitemapUrl?`: `string` \| `null`; `sourceType`: `"text"` \| `"website"` \| `"file"`; `textContent?`: `string` \| `null`; `title?`: `string` \| `null`; `url?`: `string`; \}, \{ `chatbotConfigId`: `number`; `description?`: `string` \| `null`; `fileName?`: `string` \| `null`; `maxPages?`: `number` \| `null`; `sitemapUrl?`: `string` \| `null`; `sourceType?`: `"text"` \| `"website"` \| `"file"`; `textContent?`: `string` \| `null`; `title?`: `string` \| `null`; `url?`: `string`; \}\>

Defined in: [shared/schema.ts:287](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/shared/schema.ts#L287)
