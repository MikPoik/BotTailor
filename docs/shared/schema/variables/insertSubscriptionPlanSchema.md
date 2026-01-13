[**rest-express**](../../../README.md)

***

[rest-express](../../../README.md) / [shared/schema](../README.md) / insertSubscriptionPlanSchema

# Variable: insertSubscriptionPlanSchema

> `const` **insertSubscriptionPlanSchema**: `ZodObject`\<`Pick`\<\{ `billingInterval`: `ZodOptional`\<`ZodString`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `currency`: `ZodOptional`\<`ZodString`\>; `description`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `features`: `ZodOptional`\<`ZodNullable`\<`ZodType`\<`Json`, `ZodTypeDef`, `Json`\>\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isActive`: `ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>; `maxBots`: `ZodNumber`; `maxMessagesPerMonth`: `ZodNumber`; `name`: `ZodString`; `price`: `ZodNumber`; `stripePriceId`: `ZodString`; `stripeProductId`: `ZodString`; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `"name"` \| `"description"` \| `"isActive"` \| `"stripePriceId"` \| `"stripeProductId"` \| `"price"` \| `"currency"` \| `"billingInterval"` \| `"maxBots"` \| `"maxMessagesPerMonth"` \| `"features"`\>, `"strip"`, `ZodTypeAny`, \{ `billingInterval?`: `string`; `currency?`: `string`; `description?`: `string` \| `null`; `features?`: `Json`; `isActive?`: `boolean` \| `null`; `maxBots`: `number`; `maxMessagesPerMonth`: `number`; `name`: `string`; `price`: `number`; `stripePriceId`: `string`; `stripeProductId`: `string`; \}, \{ `billingInterval?`: `string`; `currency?`: `string`; `description?`: `string` \| `null`; `features?`: `Json`; `isActive?`: `boolean` \| `null`; `maxBots`: `number`; `maxMessagesPerMonth`: `number`; `name`: `string`; `price`: `number`; `stripePriceId`: `string`; `stripeProductId`: `string`; \}\>

Defined in: [shared/schema.ts:351](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/shared/schema.ts#L351)
