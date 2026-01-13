[**rest-express**](../../../README.md)

***

[rest-express](../../../README.md) / [shared/schema](../README.md) / insertSurveySchema

# Variable: insertSurveySchema

> `const` **insertSurveySchema**: `ZodObject`\<`Pick`\<\{ `chatbotConfigId`: `ZodNumber`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `description`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `name`: `ZodString`; `status`: `ZodOptional`\<`ZodString`\>; `surveyConfig`: `ZodType`\<`Json`, `ZodTypeDef`, `Json`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `"name"` \| `"status"` \| `"description"` \| `"chatbotConfigId"` \| `"surveyConfig"`\>, `"strip"`, `ZodTypeAny`, \{ `chatbotConfigId`: `number`; `description?`: `string` \| `null`; `name`: `string`; `status?`: `string`; `surveyConfig`: `Json`; \}, \{ `chatbotConfigId`: `number`; `description?`: `string` \| `null`; `name`: `string`; `status?`: `string`; `surveyConfig`: `Json`; \}\>

Defined in: [shared/schema.ts:327](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/shared/schema.ts#L327)
