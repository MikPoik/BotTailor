[**rest-express**](../../../README.md)

***

[rest-express](../../../README.md) / [server/storage](../README.md) / IStorage

# Interface: IStorage

Defined in: [server/storage.ts:40](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L40)

## Methods

### checkBotLimit()

> **checkBotLimit**(`userId`): `Promise`\<`boolean`\>

Defined in: [server/storage.ts:141](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L141)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### checkMessageLimit()

> **checkMessageLimit**(`userId`): `Promise`\<`boolean`\>

Defined in: [server/storage.ts:142](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L142)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### createChatbotConfig()

> **createChatbotConfig**(`config`): `Promise`\<\{ `avatarUrl`: `string` \| `null`; `backgroundImageUrl`: `string` \| `null`; `createdAt`: `Date`; `description`: `string` \| `null`; `fallbackMessage`: `string` \| `null`; `formConfirmationMessage`: `string` \| `null`; `formRecipientEmail`: `string` \| `null`; `formRecipientName`: `string` \| `null`; `guid`: `string`; `homeScreenConfig`: `unknown`; `id`: `number`; `initialMessages`: `unknown`; `isActive`: `boolean` \| `null`; `maxTokens`: `number` \| `null`; `model`: `string`; `name`: `string`; `senderEmail`: `string` \| `null`; `senderName`: `string` \| `null`; `systemPrompt`: `string`; `temperature`: `number` \| `null`; `updatedAt`: `Date`; `userId`: `string`; `welcomeMessage`: `string` \| `null`; \}\>

Defined in: [server/storage.ts:63](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L63)

#### Parameters

##### config

###### avatarUrl?

`string` \| `null` = `...`

###### backgroundImageUrl?

`string` \| `null` = `...`

###### description?

`string` \| `null` = `...`

###### fallbackMessage?

`string` \| `null` = `...`

###### formConfirmationMessage?

`string` \| `null` = `...`

###### formRecipientEmail?

`string` \| `null` = `...`

###### formRecipientName?

`string` \| `null` = `...`

###### guid?

`string` = `...`

###### homeScreenConfig?

`Json` = `...`

###### initialMessages?

`Json` = `...`

###### isActive?

`boolean` \| `null` = `...`

###### maxTokens?

`number` \| `null` = `...`

###### model?

`string` = `...`

###### name

`string` = `...`

###### senderEmail?

`string` \| `null` = `...`

###### senderName?

`string` \| `null` = `...`

###### systemPrompt

`string` = `...`

###### temperature?

`number` \| `null` = `...`

###### userId

`string` = `...`

###### welcomeMessage?

`string` \| `null` = `...`

#### Returns

`Promise`\<\{ `avatarUrl`: `string` \| `null`; `backgroundImageUrl`: `string` \| `null`; `createdAt`: `Date`; `description`: `string` \| `null`; `fallbackMessage`: `string` \| `null`; `formConfirmationMessage`: `string` \| `null`; `formRecipientEmail`: `string` \| `null`; `formRecipientName`: `string` \| `null`; `guid`: `string`; `homeScreenConfig`: `unknown`; `id`: `number`; `initialMessages`: `unknown`; `isActive`: `boolean` \| `null`; `maxTokens`: `number` \| `null`; `model`: `string`; `name`: `string`; `senderEmail`: `string` \| `null`; `senderName`: `string` \| `null`; `systemPrompt`: `string`; `temperature`: `number` \| `null`; `updatedAt`: `Date`; `userId`: `string`; `welcomeMessage`: `string` \| `null`; \}\>

***

### createChatSession()

> **createChatSession**(`session`): `Promise`\<\{ `activeSurveyId`: `number` \| `null`; `chatbotConfigId`: `number` \| `null`; `createdAt`: `Date`; `id`: `number`; `sessionId`: `string`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \}\>

Defined in: [server/storage.ts:49](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L49)

#### Parameters

##### session

###### activeSurveyId?

`number` \| `null` = `...`

###### chatbotConfigId?

`number` \| `null` = `...`

###### sessionId

`string` = `...`

###### userId?

`string` \| `null` = `...`

#### Returns

`Promise`\<\{ `activeSurveyId`: `number` \| `null`; `chatbotConfigId`: `number` \| `null`; `createdAt`: `Date`; `id`: `number`; `sessionId`: `string`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \}\>

***

### createMessage()

> **createMessage**(`message`): `Promise`\<\{ `content`: `string`; `createdAt`: `Date`; `id`: `number`; `messageType`: `string`; `metadata`: `unknown`; `sender`: `string`; `sessionId`: `string`; \}\>

Defined in: [server/storage.ts:56](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L56)

#### Parameters

##### message

###### content

`string` = `...`

###### messageType

`"form"` \| `"menu"` \| `"text"` \| `"audio"` \| `"video"` \| `"image"` \| `"system"` \| `"file"` \| `"card"` \| `"multiselect_menu"` \| `"rating"` \| `"quickReplies"` \| `"form_submission"` = `...`

###### metadata

`Record`\<`string`, `any`\> = `...`

###### sender

`"user"` \| `"bot"` \| `"assistant"` = `...`

###### sessionId

`string` = `...`

#### Returns

`Promise`\<\{ `content`: `string`; `createdAt`: `Date`; `id`: `number`; `messageType`: `string`; `metadata`: `unknown`; `sender`: `string`; `sessionId`: `string`; \}\>

***

### createSubscription()

> **createSubscription**(`subscription`): `Promise`\<\{ `cancelAtPeriodEnd`: `boolean` \| `null`; `createdAt`: `Date`; `currentPeriodEnd`: `Date` \| `null`; `currentPeriodStart`: `Date` \| `null`; `id`: `number`; `messagesUsedThisMonth`: `number` \| `null`; `planId`: `number`; `status`: `string`; `stripeCustomerId`: `string` \| `null`; `stripeSubscriptionId`: `string` \| `null`; `updatedAt`: `Date`; `userId`: `string`; \}\>

Defined in: [server/storage.ts:135](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L135)

#### Parameters

##### subscription

###### currentPeriodEnd?

`Date` \| `null` = `...`

###### currentPeriodStart?

`Date` \| `null` = `...`

###### messagesUsedThisMonth?

`number` \| `null` = `...`

###### planId

`number` = `...`

###### status?

`string` = `...`

###### stripeCustomerId?

`string` \| `null` = `...`

###### stripeSubscriptionId?

`string` \| `null` = `...`

###### userId

`string` = `...`

#### Returns

`Promise`\<\{ `cancelAtPeriodEnd`: `boolean` \| `null`; `createdAt`: `Date`; `currentPeriodEnd`: `Date` \| `null`; `currentPeriodStart`: `Date` \| `null`; `id`: `number`; `messagesUsedThisMonth`: `number` \| `null`; `planId`: `number`; `status`: `string`; `stripeCustomerId`: `string` \| `null`; `stripeSubscriptionId`: `string` \| `null`; `updatedAt`: `Date`; `userId`: `string`; \}\>

***

### createSubscriptionPlan()

> **createSubscriptionPlan**(`plan`): `Promise`\<\{ `billingInterval`: `string`; `createdAt`: `Date`; `currency`: `string`; `description`: `string` \| `null`; `features`: `unknown`; `id`: `number`; `isActive`: `boolean` \| `null`; `maxBots`: `number`; `maxMessagesPerMonth`: `number`; `name`: `string`; `price`: `number`; `stripePriceId`: `string`; `stripeProductId`: `string`; `updatedAt`: `Date`; \}\>

Defined in: [server/storage.ts:129](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L129)

#### Parameters

##### plan

###### billingInterval?

`string` = `...`

###### currency?

`string` = `...`

###### description?

`string` \| `null` = `...`

###### features?

`Json` = `...`

###### isActive?

`boolean` \| `null` = `...`

###### maxBots

`number` = `...`

###### maxMessagesPerMonth

`number` = `...`

###### name

`string` = `...`

###### price

`number` = `...`

###### stripePriceId

`string` = `...`

###### stripeProductId

`string` = `...`

#### Returns

`Promise`\<\{ `billingInterval`: `string`; `createdAt`: `Date`; `currency`: `string`; `description`: `string` \| `null`; `features`: `unknown`; `id`: `number`; `isActive`: `boolean` \| `null`; `maxBots`: `number`; `maxMessagesPerMonth`: `number`; `name`: `string`; `price`: `number`; `stripePriceId`: `string`; `stripeProductId`: `string`; `updatedAt`: `Date`; \}\>

***

### createSurvey()

> **createSurvey**(`surveyData`): `Promise`\<\{ `chatbotConfigId`: `number`; `createdAt`: `Date`; `description`: `string` \| `null`; `id`: `number`; `name`: `string`; `status`: `string`; `surveyConfig`: `unknown`; `updatedAt`: `Date`; \}\>

Defined in: [server/storage.ts:82](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L82)

#### Parameters

##### surveyData

###### chatbotConfigId

`number` = `...`

###### description?

`string` \| `null` = `...`

###### name

`string` = `...`

###### status?

`string` = `...`

###### surveyConfig

`Json` = `...`

#### Returns

`Promise`\<\{ `chatbotConfigId`: `number`; `createdAt`: `Date`; `description`: `string` \| `null`; `id`: `number`; `name`: `string`; `status`: `string`; `surveyConfig`: `unknown`; `updatedAt`: `Date`; \}\>

***

### createSurveySession()

> **createSurveySession**(`sessionData`): `Promise`\<\{ `completedAt`: `Date` \| `null`; `completionHandled`: `boolean` \| `null`; `createdAt`: `Date`; `currentQuestionIndex`: `number` \| `null`; `id`: `number`; `responses`: `unknown`; `sessionId`: `string`; `status`: `string`; `surveyId`: `number`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \}\>

Defined in: [server/storage.ts:88](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L88)

#### Parameters

##### sessionData

###### currentQuestionIndex?

`number` \| `null`

###### responses?

`Json`

###### sessionId

`string`

###### status?

`string`

###### surveyId

`number`

###### userId?

`string` \| `null`

#### Returns

`Promise`\<\{ `completedAt`: `Date` \| `null`; `completionHandled`: `boolean` \| `null`; `createdAt`: `Date`; `currentQuestionIndex`: `number` \| `null`; `id`: `number`; `responses`: `unknown`; `sessionId`: `string`; `status`: `string`; `surveyId`: `number`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \}\>

***

### createWebsiteContent()

> **createWebsiteContent**(`content`, `embeddingArray`): `Promise`\<\{ `content`: `string`; `contentType`: `string` \| `null`; `createdAt`: `Date`; `embedding`: `number`[] \| `null`; `id`: `number`; `title`: `string` \| `null`; `url`: `string`; `websiteSourceId`: `number`; `wordCount`: `number` \| `null`; \}\>

Defined in: [server/storage.ts:76](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L76)

#### Parameters

##### content

###### content

`string` = `...`

###### contentType?

`string` \| `null` = `...`

###### title?

`string` \| `null` = `...`

###### url

`string` = `...`

###### websiteSourceId

`number` = `...`

###### wordCount?

`number` \| `null` = `...`

##### embeddingArray

`number`[]

#### Returns

`Promise`\<\{ `content`: `string`; `contentType`: `string` \| `null`; `createdAt`: `Date`; `embedding`: `number`[] \| `null`; `id`: `number`; `title`: `string` \| `null`; `url`: `string`; `websiteSourceId`: `number`; `wordCount`: `number` \| `null`; \}\>

***

### createWebsiteSource()

> **createWebsiteSource**(`source`): `Promise`\<\{ `chatbotConfigId`: `number`; `createdAt`: `Date`; `description`: `string` \| `null`; `errorMessage`: `string` \| `null`; `fileName`: `string` \| `null`; `id`: `number`; `lastScanned`: `Date` \| `null`; `maxPages`: `number` \| `null`; `sitemapUrl`: `string` \| `null`; `sourceType`: `string`; `status`: `string`; `textContent`: `string` \| `null`; `title`: `string` \| `null`; `totalPages`: `number` \| `null`; `updatedAt`: `Date`; `url`: `string` \| `null`; \}\>

Defined in: [server/storage.ts:70](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L70)

#### Parameters

##### source

###### chatbotConfigId

`number` = `...`

###### description?

`string` \| `null` = `...`

###### fileName?

`string` \| `null` = `...`

###### maxPages?

`number` \| `null` = `...`

###### sitemapUrl?

`string` \| `null` = `...`

###### sourceType

`"text"` \| `"website"` \| `"file"` = `...`

###### textContent?

`string` \| `null` = `...`

###### title?

`string` \| `null` = `...`

###### url?

`string` = `...`

#### Returns

`Promise`\<\{ `chatbotConfigId`: `number`; `createdAt`: `Date`; `description`: `string` \| `null`; `errorMessage`: `string` \| `null`; `fileName`: `string` \| `null`; `id`: `number`; `lastScanned`: `Date` \| `null`; `maxPages`: `number` \| `null`; `sitemapUrl`: `string` \| `null`; `sourceType`: `string`; `status`: `string`; `textContent`: `string` \| `null`; `title`: `string` \| `null`; `totalPages`: `number` \| `null`; `updatedAt`: `Date`; `url`: `string` \| `null`; \}\>

***

### deactivateAllSurveySessions()

> **deactivateAllSurveySessions**(`sessionId`): `Promise`\<`void`\>

Defined in: [server/storage.ts:95](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L95)

#### Parameters

##### sessionId

`string`

#### Returns

`Promise`\<`void`\>

***

### deleteAllChatSessions()

> **deleteAllChatSessions**(`chatbotConfigId`): `Promise`\<`void`\>

Defined in: [server/storage.ts:52](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L52)

#### Parameters

##### chatbotConfigId

`number`

#### Returns

`Promise`\<`void`\>

***

### deleteAllSurveyHistory()

> **deleteAllSurveyHistory**(`chatbotConfigId`): `Promise`\<`void`\>

Defined in: [server/storage.ts:121](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L121)

#### Parameters

##### chatbotConfigId

`number`

#### Returns

`Promise`\<`void`\>

***

### deleteChatbotConfig()

> **deleteChatbotConfig**(`id`): `Promise`\<`void`\>

Defined in: [server/storage.ts:65](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L65)

#### Parameters

##### id

`number`

#### Returns

`Promise`\<`void`\>

***

### deleteChatSession()

> **deleteChatSession**(`sessionId`): `Promise`\<`void`\>

Defined in: [server/storage.ts:51](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L51)

#### Parameters

##### sessionId

`string`

#### Returns

`Promise`\<`void`\>

***

### deleteSurvey()

> **deleteSurvey**(`id`): `Promise`\<`void`\>

Defined in: [server/storage.ts:84](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L84)

#### Parameters

##### id

`number`

#### Returns

`Promise`\<`void`\>

***

### deleteWebsiteSource()

> **deleteWebsiteSource**(`id`): `Promise`\<`void`\>

Defined in: [server/storage.ts:72](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L72)

#### Parameters

##### id

`number`

#### Returns

`Promise`\<`void`\>

***

### getActiveSurveySession()

> **getActiveSurveySession**(`sessionId`): `Promise`\<\{ `completedAt`: `Date` \| `null`; `completionHandled`: `boolean` \| `null`; `createdAt`: `Date`; `currentQuestionIndex`: `number` \| `null`; `id`: `number`; `responses`: `unknown`; `sessionId`: `string`; `status`: `string`; `surveyId`: `number`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:94](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L94)

#### Parameters

##### sessionId

`string`

#### Returns

`Promise`\<\{ `completedAt`: `Date` \| `null`; `completionHandled`: `boolean` \| `null`; `createdAt`: `Date`; `currentQuestionIndex`: `number` \| `null`; `id`: `number`; `responses`: `unknown`; `sessionId`: `string`; `status`: `string`; `surveyId`: `number`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

***

### getChatbotConfig()

> **getChatbotConfig**(`id`): `Promise`\<\{ `avatarUrl`: `string` \| `null`; `backgroundImageUrl`: `string` \| `null`; `createdAt`: `Date`; `description`: `string` \| `null`; `fallbackMessage`: `string` \| `null`; `formConfirmationMessage`: `string` \| `null`; `formRecipientEmail`: `string` \| `null`; `formRecipientName`: `string` \| `null`; `guid`: `string`; `homeScreenConfig`: `unknown`; `id`: `number`; `initialMessages`: `unknown`; `isActive`: `boolean` \| `null`; `maxTokens`: `number` \| `null`; `model`: `string`; `name`: `string`; `senderEmail`: `string` \| `null`; `senderName`: `string` \| `null`; `systemPrompt`: `string`; `temperature`: `number` \| `null`; `updatedAt`: `Date`; `userId`: `string`; `welcomeMessage`: `string` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:61](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L61)

#### Parameters

##### id

`number`

#### Returns

`Promise`\<\{ `avatarUrl`: `string` \| `null`; `backgroundImageUrl`: `string` \| `null`; `createdAt`: `Date`; `description`: `string` \| `null`; `fallbackMessage`: `string` \| `null`; `formConfirmationMessage`: `string` \| `null`; `formRecipientEmail`: `string` \| `null`; `formRecipientName`: `string` \| `null`; `guid`: `string`; `homeScreenConfig`: `unknown`; `id`: `number`; `initialMessages`: `unknown`; `isActive`: `boolean` \| `null`; `maxTokens`: `number` \| `null`; `model`: `string`; `name`: `string`; `senderEmail`: `string` \| `null`; `senderName`: `string` \| `null`; `systemPrompt`: `string`; `temperature`: `number` \| `null`; `updatedAt`: `Date`; `userId`: `string`; `welcomeMessage`: `string` \| `null`; \} \| `undefined`\>

***

### getChatbotConfigByGuid()

> **getChatbotConfigByGuid**(`userId`, `guid`): `Promise`\<\{ `avatarUrl`: `string` \| `null`; `backgroundImageUrl`: `string` \| `null`; `createdAt`: `Date`; `description`: `string` \| `null`; `fallbackMessage`: `string` \| `null`; `formConfirmationMessage`: `string` \| `null`; `formRecipientEmail`: `string` \| `null`; `formRecipientName`: `string` \| `null`; `guid`: `string`; `homeScreenConfig`: `unknown`; `id`: `number`; `initialMessages`: `unknown`; `isActive`: `boolean` \| `null`; `maxTokens`: `number` \| `null`; `model`: `string`; `name`: `string`; `senderEmail`: `string` \| `null`; `senderName`: `string` \| `null`; `systemPrompt`: `string`; `temperature`: `number` \| `null`; `updatedAt`: `Date`; `userId`: `string`; `welcomeMessage`: `string` \| `null`; \} \| `null`\>

Defined in: [server/storage.ts:62](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L62)

#### Parameters

##### userId

`string`

##### guid

`string`

#### Returns

`Promise`\<\{ `avatarUrl`: `string` \| `null`; `backgroundImageUrl`: `string` \| `null`; `createdAt`: `Date`; `description`: `string` \| `null`; `fallbackMessage`: `string` \| `null`; `formConfirmationMessage`: `string` \| `null`; `formRecipientEmail`: `string` \| `null`; `formRecipientName`: `string` \| `null`; `guid`: `string`; `homeScreenConfig`: `unknown`; `id`: `number`; `initialMessages`: `unknown`; `isActive`: `boolean` \| `null`; `maxTokens`: `number` \| `null`; `model`: `string`; `name`: `string`; `senderEmail`: `string` \| `null`; `senderName`: `string` \| `null`; `systemPrompt`: `string`; `temperature`: `number` \| `null`; `updatedAt`: `Date`; `userId`: `string`; `welcomeMessage`: `string` \| `null`; \} \| `null`\>

***

### getChatbotConfigs()

> **getChatbotConfigs**(`userId`): `Promise`\<`object`[]\>

Defined in: [server/storage.ts:60](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L60)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`object`[]\>

***

### getChatSession()

> **getChatSession**(`sessionId`): `Promise`\<\{ `activeSurveyId`: `number` \| `null`; `chatbotConfigId`: `number` \| `null`; `createdAt`: `Date`; `id`: `number`; `sessionId`: `string`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:46](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L46)

#### Parameters

##### sessionId

`string`

#### Returns

`Promise`\<\{ `activeSurveyId`: `number` \| `null`; `chatbotConfigId`: `number` \| `null`; `createdAt`: `Date`; `id`: `number`; `sessionId`: `string`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

***

### getChatSessionsByChatbotGuid()

> **getChatSessionsByChatbotGuid**(`chatbotGuid`, `offset?`, `limit?`): `Promise`\<`object`[]\>

Defined in: [server/storage.ts:47](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L47)

#### Parameters

##### chatbotGuid

`string`

##### offset?

`number`

##### limit?

`number`

#### Returns

`Promise`\<`object`[]\>

***

### getChatSessionsCountByChatbotGuid()

> **getChatSessionsCountByChatbotGuid**(`chatbotGuid`): `Promise`\<`number`\>

Defined in: [server/storage.ts:48](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L48)

#### Parameters

##### chatbotGuid

`string`

#### Returns

`Promise`\<`number`\>

***

### getConversationCount()

> **getConversationCount**(`userId`): `Promise`\<`number`\>

Defined in: [server/storage.ts:124](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L124)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`number`\>

***

### getMessages()

> **getMessages**(`sessionId`): `Promise`\<`object`[]\>

Defined in: [server/storage.ts:55](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L55)

#### Parameters

##### sessionId

`string`

#### Returns

`Promise`\<`object`[]\>

***

### getOrCreateFreeSubscription()

> **getOrCreateFreeSubscription**(`userId`): `Promise`\<`object` & `object`\>

Defined in: [server/storage.ts:143](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L143)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`object` & `object`\>

***

### getRecentMessages()

> **getRecentMessages**(`sessionId`, `limit?`): `Promise`\<`object`[]\>

Defined in: [server/storage.ts:57](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L57)

#### Parameters

##### sessionId

`string`

##### limit?

`number`

#### Returns

`Promise`\<`object`[]\>

***

### getSubscriptionByStripeId()

> **getSubscriptionByStripeId**(`stripeSubscriptionId`): `Promise`\<\{ `cancelAtPeriodEnd`: `boolean` \| `null`; `createdAt`: `Date`; `currentPeriodEnd`: `Date` \| `null`; `currentPeriodStart`: `Date` \| `null`; `id`: `number`; `messagesUsedThisMonth`: `number` \| `null`; `planId`: `number`; `status`: `string`; `stripeCustomerId`: `string` \| `null`; `stripeSubscriptionId`: `string` \| `null`; `updatedAt`: `Date`; `userId`: `string`; \} \| `undefined`\>

Defined in: [server/storage.ts:134](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L134)

#### Parameters

##### stripeSubscriptionId

`string`

#### Returns

`Promise`\<\{ `cancelAtPeriodEnd`: `boolean` \| `null`; `createdAt`: `Date`; `currentPeriodEnd`: `Date` \| `null`; `currentPeriodStart`: `Date` \| `null`; `id`: `number`; `messagesUsedThisMonth`: `number` \| `null`; `planId`: `number`; `status`: `string`; `stripeCustomerId`: `string` \| `null`; `stripeSubscriptionId`: `string` \| `null`; `updatedAt`: `Date`; `userId`: `string`; \} \| `undefined`\>

***

### getSubscriptionPlan()

> **getSubscriptionPlan**(`id`): `Promise`\<\{ `billingInterval`: `string`; `createdAt`: `Date`; `currency`: `string`; `description`: `string` \| `null`; `features`: `unknown`; `id`: `number`; `isActive`: `boolean` \| `null`; `maxBots`: `number`; `maxMessagesPerMonth`: `number`; `name`: `string`; `price`: `number`; `stripePriceId`: `string`; `stripeProductId`: `string`; `updatedAt`: `Date`; \} \| `undefined`\>

Defined in: [server/storage.ts:128](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L128)

#### Parameters

##### id

`number`

#### Returns

`Promise`\<\{ `billingInterval`: `string`; `createdAt`: `Date`; `currency`: `string`; `description`: `string` \| `null`; `features`: `unknown`; `id`: `number`; `isActive`: `boolean` \| `null`; `maxBots`: `number`; `maxMessagesPerMonth`: `number`; `name`: `string`; `price`: `number`; `stripePriceId`: `string`; `stripeProductId`: `string`; `updatedAt`: `Date`; \} \| `undefined`\>

***

### getSubscriptionPlans()

> **getSubscriptionPlans**(): `Promise`\<`object`[]\>

Defined in: [server/storage.ts:127](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L127)

#### Returns

`Promise`\<`object`[]\>

***

### getSurvey()

> **getSurvey**(`id`): `Promise`\<\{ `chatbotConfigId`: `number`; `createdAt`: `Date`; `description`: `string` \| `null`; `id`: `number`; `name`: `string`; `status`: `string`; `surveyConfig`: `unknown`; `updatedAt`: `Date`; \} \| `undefined`\>

Defined in: [server/storage.ts:81](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L81)

#### Parameters

##### id

`number`

#### Returns

`Promise`\<\{ `chatbotConfigId`: `number`; `createdAt`: `Date`; `description`: `string` \| `null`; `id`: `number`; `name`: `string`; `status`: `string`; `surveyConfig`: `unknown`; `updatedAt`: `Date`; \} \| `undefined`\>

***

### getSurveyAnalyticsByChatbotGuid()

> **getSurveyAnalyticsByChatbotGuid**(`chatbotGuid`): `Promise`\<\{ `averageCompletionTime`: `number`; `completionRate`: `number`; `surveyBreakdown`: `object`[]; `totalResponses`: `number`; `totalSurveys`: `number`; \}\>

Defined in: [server/storage.ts:98](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L98)

#### Parameters

##### chatbotGuid

`string`

#### Returns

`Promise`\<\{ `averageCompletionTime`: `number`; `completionRate`: `number`; `surveyBreakdown`: `object`[]; `totalResponses`: `number`; `totalSurveys`: `number`; \}\>

***

### getSurveys()

> **getSurveys**(`chatbotConfigId`): `Promise`\<`object`[]\>

Defined in: [server/storage.ts:80](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L80)

#### Parameters

##### chatbotConfigId

`number`

#### Returns

`Promise`\<`object`[]\>

***

### getSurveySession()

> **getSurveySession**(`surveyId`, `sessionId`): `Promise`\<\{ `completedAt`: `Date` \| `null`; `completionHandled`: `boolean` \| `null`; `createdAt`: `Date`; `currentQuestionIndex`: `number` \| `null`; `id`: `number`; `responses`: `unknown`; `sessionId`: `string`; `status`: `string`; `surveyId`: `number`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:87](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L87)

#### Parameters

##### surveyId

`number`

##### sessionId

`string`

#### Returns

`Promise`\<\{ `completedAt`: `Date` \| `null`; `completionHandled`: `boolean` \| `null`; `createdAt`: `Date`; `currentQuestionIndex`: `number` \| `null`; `id`: `number`; `responses`: `unknown`; `sessionId`: `string`; `status`: `string`; `surveyId`: `number`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

***

### getSurveySessionBySessionId()

> **getSurveySessionBySessionId**(`sessionId`): `Promise`\<\{ `completedAt`: `Date` \| `null`; `completionHandled`: `boolean` \| `null`; `createdAt`: `Date`; `currentQuestionIndex`: `number` \| `null`; `id`: `number`; `responses`: `unknown`; `sessionId`: `string`; `status`: `string`; `surveyId`: `number`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:90](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L90)

#### Parameters

##### sessionId

`string`

#### Returns

`Promise`\<\{ `completedAt`: `Date` \| `null`; `completionHandled`: `boolean` \| `null`; `createdAt`: `Date`; `currentQuestionIndex`: `number` \| `null`; `id`: `number`; `responses`: `unknown`; `sessionId`: `string`; `status`: `string`; `surveyId`: `number`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

***

### getUser()

> **getUser**(`id`): `Promise`\<\{ `createdAt`: `Date` \| `null`; `email`: `string` \| `null`; `firstName`: `string` \| `null`; `id`: `string`; `lastName`: `string` \| `null`; `profileImageUrl`: `string` \| `null`; `updatedAt`: `Date` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:42](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L42)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<\{ `createdAt`: `Date` \| `null`; `email`: `string` \| `null`; `firstName`: `string` \| `null`; `id`: `string`; `lastName`: `string` \| `null`; `profileImageUrl`: `string` \| `null`; `updatedAt`: `Date` \| `null`; \} \| `undefined`\>

***

### getUserSubscription()

> **getUserSubscription**(`userId`): `Promise`\<\{ `cancelAtPeriodEnd`: `boolean` \| `null`; `createdAt`: `Date`; `currentPeriodEnd`: `Date` \| `null`; `currentPeriodStart`: `Date` \| `null`; `id`: `number`; `messagesUsedThisMonth`: `number` \| `null`; `planId`: `number`; `status`: `string`; `stripeCustomerId`: `string` \| `null`; `stripeSubscriptionId`: `string` \| `null`; `updatedAt`: `Date`; `userId`: `string`; \} \| `undefined`\>

Defined in: [server/storage.ts:133](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L133)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<\{ `cancelAtPeriodEnd`: `boolean` \| `null`; `createdAt`: `Date`; `currentPeriodEnd`: `Date` \| `null`; `currentPeriodStart`: `Date` \| `null`; `id`: `number`; `messagesUsedThisMonth`: `number` \| `null`; `planId`: `number`; `status`: `string`; `stripeCustomerId`: `string` \| `null`; `stripeSubscriptionId`: `string` \| `null`; `updatedAt`: `Date`; `userId`: `string`; \} \| `undefined`\>

***

### getUserSubscriptionWithPlan()

> **getUserSubscriptionWithPlan**(`userId`): `Promise`\<`object` & `object` \| `undefined`\>

Defined in: [server/storage.ts:138](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L138)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`object` & `object` \| `undefined`\>

***

### getWebsiteContents()

> **getWebsiteContents**(`websiteSourceId`): `Promise`\<`object`[]\>

Defined in: [server/storage.ts:75](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L75)

#### Parameters

##### websiteSourceId

`number`

#### Returns

`Promise`\<`object`[]\>

***

### getWebsiteSource()

> **getWebsiteSource**(`id`): `Promise`\<\{ `chatbotConfigId`: `number`; `createdAt`: `Date`; `description`: `string` \| `null`; `errorMessage`: `string` \| `null`; `fileName`: `string` \| `null`; `id`: `number`; `lastScanned`: `Date` \| `null`; `maxPages`: `number` \| `null`; `sitemapUrl`: `string` \| `null`; `sourceType`: `string`; `status`: `string`; `textContent`: `string` \| `null`; `title`: `string` \| `null`; `totalPages`: `number` \| `null`; `updatedAt`: `Date`; `url`: `string` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:69](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L69)

#### Parameters

##### id

`number`

#### Returns

`Promise`\<\{ `chatbotConfigId`: `number`; `createdAt`: `Date`; `description`: `string` \| `null`; `errorMessage`: `string` \| `null`; `fileName`: `string` \| `null`; `id`: `number`; `lastScanned`: `Date` \| `null`; `maxPages`: `number` \| `null`; `sitemapUrl`: `string` \| `null`; `sourceType`: `string`; `status`: `string`; `textContent`: `string` \| `null`; `title`: `string` \| `null`; `totalPages`: `number` \| `null`; `updatedAt`: `Date`; `url`: `string` \| `null`; \} \| `undefined`\>

***

### getWebsiteSources()

> **getWebsiteSources**(`chatbotConfigId`): `Promise`\<`object`[]\>

Defined in: [server/storage.ts:68](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L68)

#### Parameters

##### chatbotConfigId

`number`

#### Returns

`Promise`\<`object`[]\>

***

### incrementMessageUsage()

> **incrementMessageUsage**(`userId`): `Promise`\<`void`\>

Defined in: [server/storage.ts:139](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L139)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`void`\>

***

### resetMonthlyMessageUsage()

> **resetMonthlyMessageUsage**(`userId`): `Promise`\<`void`\>

Defined in: [server/storage.ts:140](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L140)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`void`\>

***

### searchSimilarContent()

> **searchSimilarContent**(`chatbotConfigId`, `query`, `limit?`): `Promise`\<`object`[]\>

Defined in: [server/storage.ts:77](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L77)

#### Parameters

##### chatbotConfigId

`number`

##### query

`string`

##### limit?

`number`

#### Returns

`Promise`\<`object`[]\>

***

### setActiveSurvey()

> **setActiveSurvey**(`sessionId`, `surveyId`): `Promise`\<\{ `activeSurveyId`: `number` \| `null`; `chatbotConfigId`: `number` \| `null`; `createdAt`: `Date`; `id`: `number`; `sessionId`: `string`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:93](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L93)

#### Parameters

##### sessionId

`string`

##### surveyId

`number` | `null`

#### Returns

`Promise`\<\{ `activeSurveyId`: `number` \| `null`; `chatbotConfigId`: `number` \| `null`; `createdAt`: `Date`; `id`: `number`; `sessionId`: `string`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

***

### updateChatbotConfig()

> **updateChatbotConfig**(`id`, `data`): `Promise`\<\{ `avatarUrl`: `string` \| `null`; `backgroundImageUrl`: `string` \| `null`; `createdAt`: `Date`; `description`: `string` \| `null`; `fallbackMessage`: `string` \| `null`; `formConfirmationMessage`: `string` \| `null`; `formRecipientEmail`: `string` \| `null`; `formRecipientName`: `string` \| `null`; `guid`: `string`; `homeScreenConfig`: `unknown`; `id`: `number`; `initialMessages`: `unknown`; `isActive`: `boolean` \| `null`; `maxTokens`: `number` \| `null`; `model`: `string`; `name`: `string`; `senderEmail`: `string` \| `null`; `senderName`: `string` \| `null`; `systemPrompt`: `string`; `temperature`: `number` \| `null`; `updatedAt`: `Date`; `userId`: `string`; `welcomeMessage`: `string` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:64](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L64)

#### Parameters

##### id

`number`

##### data

`Partial`\<[`ChatbotConfig`](../../../shared/schema/type-aliases/ChatbotConfig.md)\>

#### Returns

`Promise`\<\{ `avatarUrl`: `string` \| `null`; `backgroundImageUrl`: `string` \| `null`; `createdAt`: `Date`; `description`: `string` \| `null`; `fallbackMessage`: `string` \| `null`; `formConfirmationMessage`: `string` \| `null`; `formRecipientEmail`: `string` \| `null`; `formRecipientName`: `string` \| `null`; `guid`: `string`; `homeScreenConfig`: `unknown`; `id`: `number`; `initialMessages`: `unknown`; `isActive`: `boolean` \| `null`; `maxTokens`: `number` \| `null`; `model`: `string`; `name`: `string`; `senderEmail`: `string` \| `null`; `senderName`: `string` \| `null`; `systemPrompt`: `string`; `temperature`: `number` \| `null`; `updatedAt`: `Date`; `userId`: `string`; `welcomeMessage`: `string` \| `null`; \} \| `undefined`\>

***

### updateChatSession()

> **updateChatSession**(`sessionId`, `data`): `Promise`\<\{ `activeSurveyId`: `number` \| `null`; `chatbotConfigId`: `number` \| `null`; `createdAt`: `Date`; `id`: `number`; `sessionId`: `string`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:50](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L50)

#### Parameters

##### sessionId

`string`

##### data

`Partial`\<[`ChatSession`](../../../shared/schema/type-aliases/ChatSession.md)\>

#### Returns

`Promise`\<\{ `activeSurveyId`: `number` \| `null`; `chatbotConfigId`: `number` \| `null`; `createdAt`: `Date`; `id`: `number`; `sessionId`: `string`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

***

### updateSubscription()

> **updateSubscription**(`id`, `data`): `Promise`\<\{ `cancelAtPeriodEnd`: `boolean` \| `null`; `createdAt`: `Date`; `currentPeriodEnd`: `Date` \| `null`; `currentPeriodStart`: `Date` \| `null`; `id`: `number`; `messagesUsedThisMonth`: `number` \| `null`; `planId`: `number`; `status`: `string`; `stripeCustomerId`: `string` \| `null`; `stripeSubscriptionId`: `string` \| `null`; `updatedAt`: `Date`; `userId`: `string`; \} \| `undefined`\>

Defined in: [server/storage.ts:136](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L136)

#### Parameters

##### id

`number`

##### data

`Partial`\<[`Subscription`](../../../shared/schema/type-aliases/Subscription.md)\>

#### Returns

`Promise`\<\{ `cancelAtPeriodEnd`: `boolean` \| `null`; `createdAt`: `Date`; `currentPeriodEnd`: `Date` \| `null`; `currentPeriodStart`: `Date` \| `null`; `id`: `number`; `messagesUsedThisMonth`: `number` \| `null`; `planId`: `number`; `status`: `string`; `stripeCustomerId`: `string` \| `null`; `stripeSubscriptionId`: `string` \| `null`; `updatedAt`: `Date`; `userId`: `string`; \} \| `undefined`\>

***

### updateSubscriptionByStripeId()

> **updateSubscriptionByStripeId**(`stripeSubscriptionId`, `data`): `Promise`\<\{ `cancelAtPeriodEnd`: `boolean` \| `null`; `createdAt`: `Date`; `currentPeriodEnd`: `Date` \| `null`; `currentPeriodStart`: `Date` \| `null`; `id`: `number`; `messagesUsedThisMonth`: `number` \| `null`; `planId`: `number`; `status`: `string`; `stripeCustomerId`: `string` \| `null`; `stripeSubscriptionId`: `string` \| `null`; `updatedAt`: `Date`; `userId`: `string`; \} \| `undefined`\>

Defined in: [server/storage.ts:137](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L137)

#### Parameters

##### stripeSubscriptionId

`string`

##### data

`Partial`\<[`Subscription`](../../../shared/schema/type-aliases/Subscription.md)\>

#### Returns

`Promise`\<\{ `cancelAtPeriodEnd`: `boolean` \| `null`; `createdAt`: `Date`; `currentPeriodEnd`: `Date` \| `null`; `currentPeriodStart`: `Date` \| `null`; `id`: `number`; `messagesUsedThisMonth`: `number` \| `null`; `planId`: `number`; `status`: `string`; `stripeCustomerId`: `string` \| `null`; `stripeSubscriptionId`: `string` \| `null`; `updatedAt`: `Date`; `userId`: `string`; \} \| `undefined`\>

***

### updateSubscriptionPlan()

> **updateSubscriptionPlan**(`id`, `data`): `Promise`\<\{ `billingInterval`: `string`; `createdAt`: `Date`; `currency`: `string`; `description`: `string` \| `null`; `features`: `unknown`; `id`: `number`; `isActive`: `boolean` \| `null`; `maxBots`: `number`; `maxMessagesPerMonth`: `number`; `name`: `string`; `price`: `number`; `stripePriceId`: `string`; `stripeProductId`: `string`; `updatedAt`: `Date`; \} \| `undefined`\>

Defined in: [server/storage.ts:130](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L130)

#### Parameters

##### id

`number`

##### data

`Partial`\<[`SubscriptionPlan`](../../../shared/schema/type-aliases/SubscriptionPlan.md)\>

#### Returns

`Promise`\<\{ `billingInterval`: `string`; `createdAt`: `Date`; `currency`: `string`; `description`: `string` \| `null`; `features`: `unknown`; `id`: `number`; `isActive`: `boolean` \| `null`; `maxBots`: `number`; `maxMessagesPerMonth`: `number`; `name`: `string`; `price`: `number`; `stripePriceId`: `string`; `stripeProductId`: `string`; `updatedAt`: `Date`; \} \| `undefined`\>

***

### updateSurvey()

> **updateSurvey**(`id`, `data`): `Promise`\<\{ `chatbotConfigId`: `number`; `createdAt`: `Date`; `description`: `string` \| `null`; `id`: `number`; `name`: `string`; `status`: `string`; `surveyConfig`: `unknown`; `updatedAt`: `Date`; \} \| `undefined`\>

Defined in: [server/storage.ts:83](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L83)

#### Parameters

##### id

`number`

##### data

`Partial`\<[`Survey`](../../../shared/schema/type-aliases/Survey.md)\>

#### Returns

`Promise`\<\{ `chatbotConfigId`: `number`; `createdAt`: `Date`; `description`: `string` \| `null`; `id`: `number`; `name`: `string`; `status`: `string`; `surveyConfig`: `unknown`; `updatedAt`: `Date`; \} \| `undefined`\>

***

### updateSurveySession()

> **updateSurveySession**(`id`, `data`): `Promise`\<\{ `completedAt`: `Date` \| `null`; `completionHandled`: `boolean` \| `null`; `createdAt`: `Date`; `currentQuestionIndex`: `number` \| `null`; `id`: `number`; `responses`: `unknown`; `sessionId`: `string`; `status`: `string`; `surveyId`: `number`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:89](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L89)

#### Parameters

##### id

`number`

##### data

`Partial`\<[`SurveySession`](../../../shared/schema/type-aliases/SurveySession.md)\>

#### Returns

`Promise`\<\{ `completedAt`: `Date` \| `null`; `completionHandled`: `boolean` \| `null`; `createdAt`: `Date`; `currentQuestionIndex`: `number` \| `null`; `id`: `number`; `responses`: `unknown`; `sessionId`: `string`; `status`: `string`; `surveyId`: `number`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

***

### updateWebsiteSource()

> **updateWebsiteSource**(`id`, `data`): `Promise`\<\{ `chatbotConfigId`: `number`; `createdAt`: `Date`; `description`: `string` \| `null`; `errorMessage`: `string` \| `null`; `fileName`: `string` \| `null`; `id`: `number`; `lastScanned`: `Date` \| `null`; `maxPages`: `number` \| `null`; `sitemapUrl`: `string` \| `null`; `sourceType`: `string`; `status`: `string`; `textContent`: `string` \| `null`; `title`: `string` \| `null`; `totalPages`: `number` \| `null`; `updatedAt`: `Date`; `url`: `string` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:71](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L71)

#### Parameters

##### id

`number`

##### data

`Partial`\<[`WebsiteSource`](../../../shared/schema/type-aliases/WebsiteSource.md)\>

#### Returns

`Promise`\<\{ `chatbotConfigId`: `number`; `createdAt`: `Date`; `description`: `string` \| `null`; `errorMessage`: `string` \| `null`; `fileName`: `string` \| `null`; `id`: `number`; `lastScanned`: `Date` \| `null`; `maxPages`: `number` \| `null`; `sitemapUrl`: `string` \| `null`; `sourceType`: `string`; `status`: `string`; `textContent`: `string` \| `null`; `title`: `string` \| `null`; `totalPages`: `number` \| `null`; `updatedAt`: `Date`; `url`: `string` \| `null`; \} \| `undefined`\>

***

### upsertUser()

> **upsertUser**(`user`): `Promise`\<\{ `createdAt`: `Date` \| `null`; `email`: `string` \| `null`; `firstName`: `string` \| `null`; `id`: `string`; `lastName`: `string` \| `null`; `profileImageUrl`: `string` \| `null`; `updatedAt`: `Date` \| `null`; \}\>

Defined in: [server/storage.ts:43](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L43)

#### Parameters

##### user

###### email?

`string` \| `null` = `...`

###### firstName?

`string` \| `null` = `...`

###### id

`string` = `...`

###### lastName?

`string` \| `null` = `...`

###### profileImageUrl?

`string` \| `null` = `...`

#### Returns

`Promise`\<\{ `createdAt`: `Date` \| `null`; `email`: `string` \| `null`; `firstName`: `string` \| `null`; `id`: `string`; `lastName`: `string` \| `null`; `profileImageUrl`: `string` \| `null`; `updatedAt`: `Date` \| `null`; \}\>
