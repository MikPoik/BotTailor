[**rest-express**](../../../README.md)

***

[rest-express](../../../README.md) / [shared/schema](../README.md) / insertSubscriptionSchema

# Variable: insertSubscriptionSchema

> `const` **insertSubscriptionSchema**: `ZodObject`\<`Pick`\<\{ `cancelAtPeriodEnd`: `ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `currentPeriodEnd`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `currentPeriodStart`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `messagesUsedThisMonth`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `planId`: `ZodNumber`; `status`: `ZodOptional`\<`ZodString`\>; `stripeCustomerId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `stripeSubscriptionId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `userId`: `ZodString`; \}, `"status"` \| `"userId"` \| `"planId"` \| `"stripeSubscriptionId"` \| `"stripeCustomerId"` \| `"currentPeriodStart"` \| `"currentPeriodEnd"` \| `"messagesUsedThisMonth"`\>, `"strip"`, `ZodTypeAny`, \{ `currentPeriodEnd?`: `Date` \| `null`; `currentPeriodStart?`: `Date` \| `null`; `messagesUsedThisMonth?`: `number` \| `null`; `planId`: `number`; `status?`: `string`; `stripeCustomerId?`: `string` \| `null`; `stripeSubscriptionId?`: `string` \| `null`; `userId`: `string`; \}, \{ `currentPeriodEnd?`: `Date` \| `null`; `currentPeriodStart?`: `Date` \| `null`; `messagesUsedThisMonth?`: `number` \| `null`; `planId`: `number`; `status?`: `string`; `stripeCustomerId?`: `string` \| `null`; `stripeSubscriptionId?`: `string` \| `null`; `userId`: `string`; \}\>

Defined in: [shared/schema.ts:365](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/shared/schema.ts#L365)
