[**rest-express**](../../../README.md)

***

[rest-express](../../../README.md) / [server/storage](../README.md) / DatabaseStorage

# Class: DatabaseStorage

Defined in: [server/storage.ts:147](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L147)

## Implements

- [`IStorage`](../interfaces/IStorage.md)

## Constructors

### Constructor

> **new DatabaseStorage**(): `DatabaseStorage`

#### Returns

`DatabaseStorage`

## Methods

### checkBotLimit()

> **checkBotLimit**(`userId`): `Promise`\<`boolean`\>

Defined in: [server/storage.ts:835](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L835)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`checkBotLimit`](../interfaces/IStorage.md#checkbotlimit)

***

### checkMessageLimit()

> **checkMessageLimit**(`userId`): `Promise`\<`boolean`\>

Defined in: [server/storage.ts:862](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L862)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`checkMessageLimit`](../interfaces/IStorage.md#checkmessagelimit)

***

### createChatbotConfig()

> **createChatbotConfig**(`configData`): `Promise`\<\{ `avatarUrl`: `string` \| `null`; `backgroundImageUrl`: `string` \| `null`; `createdAt`: `Date`; `description`: `string` \| `null`; `fallbackMessage`: `string` \| `null`; `formConfirmationMessage`: `string` \| `null`; `formRecipientEmail`: `string` \| `null`; `formRecipientName`: `string` \| `null`; `guid`: `string`; `homeScreenConfig`: `unknown`; `id`: `number`; `initialMessages`: `unknown`; `isActive`: `boolean` \| `null`; `maxTokens`: `number` \| `null`; `model`: `string`; `name`: `string`; `senderEmail`: `string` \| `null`; `senderName`: `string` \| `null`; `systemPrompt`: `string`; `temperature`: `number` \| `null`; `updatedAt`: `Date`; `userId`: `string`; `welcomeMessage`: `string` \| `null`; \}\>

Defined in: [server/storage.ts:353](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L353)

#### Parameters

##### configData

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

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`createChatbotConfig`](../interfaces/IStorage.md#createchatbotconfig)

***

### createChatSession()

> **createChatSession**(`sessionData`): `Promise`\<\{ `activeSurveyId`: `number` \| `null`; `chatbotConfigId`: `number` \| `null`; `createdAt`: `Date`; `id`: `number`; `sessionId`: `string`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \}\>

Defined in: [server/storage.ts:235](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L235)

#### Parameters

##### sessionData

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

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`createChatSession`](../interfaces/IStorage.md#createchatsession)

***

### createMessage()

> **createMessage**(`messageData`): `Promise`\<\{ `content`: `string`; `createdAt`: `Date`; `id`: `number`; `messageType`: `string`; `metadata`: `unknown`; `sender`: `string`; `sessionId`: `string`; \}\>

Defined in: [server/storage.ts:315](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L315)

#### Parameters

##### messageData

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

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`createMessage`](../interfaces/IStorage.md#createmessage)

***

### createSubscription()

> **createSubscription**(`subscriptionData`): `Promise`\<\{ `cancelAtPeriodEnd`: `boolean` \| `null`; `createdAt`: `Date`; `currentPeriodEnd`: `Date` \| `null`; `currentPeriodStart`: `Date` \| `null`; `id`: `number`; `messagesUsedThisMonth`: `number` \| `null`; `planId`: `number`; `status`: `string`; `stripeCustomerId`: `string` \| `null`; `stripeSubscriptionId`: `string` \| `null`; `updatedAt`: `Date`; `userId`: `string`; \}\>

Defined in: [server/storage.ts:733](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L733)

#### Parameters

##### subscriptionData

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

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`createSubscription`](../interfaces/IStorage.md#createsubscription)

***

### createSubscriptionPlan()

> **createSubscriptionPlan**(`planData`): `Promise`\<\{ `billingInterval`: `string`; `createdAt`: `Date`; `currency`: `string`; `description`: `string` \| `null`; `features`: `unknown`; `id`: `number`; `isActive`: `boolean` \| `null`; `maxBots`: `number`; `maxMessagesPerMonth`: `number`; `name`: `string`; `price`: `number`; `stripePriceId`: `string`; `stripeProductId`: `string`; `updatedAt`: `Date`; \}\>

Defined in: [server/storage.ts:700](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L700)

#### Parameters

##### planData

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

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`createSubscriptionPlan`](../interfaces/IStorage.md#createsubscriptionplan)

***

### createSurvey()

> **createSurvey**(`surveyData`): `Promise`\<\{ `chatbotConfigId`: `number`; `createdAt`: `Date`; `description`: `string` \| `null`; `id`: `number`; `name`: `string`; `status`: `string`; `surveyConfig`: `unknown`; `updatedAt`: `Date`; \}\>

Defined in: [server/storage.ts:555](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L555)

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

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`createSurvey`](../interfaces/IStorage.md#createsurvey)

***

### createSurveySession()

> **createSurveySession**(`sessionData`): `Promise`\<\{ `completedAt`: `Date` \| `null`; `completionHandled`: `boolean` \| `null`; `createdAt`: `Date`; `currentQuestionIndex`: `number` \| `null`; `id`: `number`; `responses`: `unknown`; `sessionId`: `string`; `status`: `string`; `surveyId`: `number`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \}\>

Defined in: [server/storage.ts:604](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L604)

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

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`createSurveySession`](../interfaces/IStorage.md#createsurveysession)

***

### createWebsiteContent()

> **createWebsiteContent**(`contentData`, `embeddingArray`): `Promise`\<\{ `content`: `string`; `contentType`: `string` \| `null`; `createdAt`: `Date`; `embedding`: `number`[] \| `null`; `id`: `number`; `title`: `string` \| `null`; `url`: `string`; `websiteSourceId`: `number`; `wordCount`: `number` \| `null`; \}\>

Defined in: [server/storage.ts:455](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L455)

#### Parameters

##### contentData

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

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`createWebsiteContent`](../interfaces/IStorage.md#createwebsitecontent)

***

### createWebsiteSource()

> **createWebsiteSource**(`sourceData`): `Promise`\<\{ `chatbotConfigId`: `number`; `createdAt`: `Date`; `description`: `string` \| `null`; `errorMessage`: `string` \| `null`; `fileName`: `string` \| `null`; `id`: `number`; `lastScanned`: `Date` \| `null`; `maxPages`: `number` \| `null`; `sitemapUrl`: `string` \| `null`; `sourceType`: `string`; `status`: `string`; `textContent`: `string` \| `null`; `title`: `string` \| `null`; `totalPages`: `number` \| `null`; `updatedAt`: `Date`; `url`: `string` \| `null`; \}\>

Defined in: [server/storage.ts:424](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L424)

#### Parameters

##### sourceData

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

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`createWebsiteSource`](../interfaces/IStorage.md#createwebsitesource)

***

### deactivateAllSurveySessions()

> **deactivateAllSurveySessions**(`sessionId`): `Promise`\<`void`\>

Defined in: [server/storage.ts:658](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L658)

#### Parameters

##### sessionId

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`deactivateAllSurveySessions`](../interfaces/IStorage.md#deactivateallsurveysessions)

***

### deleteAllChatSessions()

> **deleteAllChatSessions**(`chatbotConfigId`): `Promise`\<`void`\>

Defined in: [server/storage.ts:291](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L291)

#### Parameters

##### chatbotConfigId

`number`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`deleteAllChatSessions`](../interfaces/IStorage.md#deleteallchatsessions)

***

### deleteAllSurveyHistory()

> **deleteAllSurveyHistory**(`chatbotConfigId`): `Promise`\<`void`\>

Defined in: [server/storage.ts:579](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L579)

#### Parameters

##### chatbotConfigId

`number`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`deleteAllSurveyHistory`](../interfaces/IStorage.md#deleteallsurveyhistory)

***

### deleteChatbotConfig()

> **deleteChatbotConfig**(`id`): `Promise`\<`void`\>

Defined in: [server/storage.ts:370](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L370)

#### Parameters

##### id

`number`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`deleteChatbotConfig`](../interfaces/IStorage.md#deletechatbotconfig)

***

### deleteChatSession()

> **deleteChatSession**(`sessionId`): `Promise`\<`void`\>

Defined in: [server/storage.ts:252](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L252)

#### Parameters

##### sessionId

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`deleteChatSession`](../interfaces/IStorage.md#deletechatsession)

***

### deleteSurvey()

> **deleteSurvey**(`id`): `Promise`\<`void`\>

Defined in: [server/storage.ts:572](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L572)

#### Parameters

##### id

`number`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`deleteSurvey`](../interfaces/IStorage.md#deletesurvey)

***

### deleteWebsiteSource()

> **deleteWebsiteSource**(`id`): `Promise`\<`void`\>

Defined in: [server/storage.ts:441](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L441)

#### Parameters

##### id

`number`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`deleteWebsiteSource`](../interfaces/IStorage.md#deletewebsitesource)

***

### getActiveSurveySession()

> **getActiveSurveySession**(`sessionId`): `Promise`\<\{ `completedAt`: `Date` \| `null`; `completionHandled`: `boolean` \| `null`; `createdAt`: `Date`; `currentQuestionIndex`: `number` \| `null`; `id`: `number`; `responses`: `unknown`; `sessionId`: `string`; `status`: `string`; `surveyId`: `number`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:647](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L647)

#### Parameters

##### sessionId

`string`

#### Returns

`Promise`\<\{ `completedAt`: `Date` \| `null`; `completionHandled`: `boolean` \| `null`; `createdAt`: `Date`; `currentQuestionIndex`: `number` \| `null`; `id`: `number`; `responses`: `unknown`; `sessionId`: `string`; `status`: `string`; `surveyId`: `number`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getActiveSurveySession`](../interfaces/IStorage.md#getactivesurveysession)

***

### getActiveSurveySessionBySurveyId()

> **getActiveSurveySessionBySurveyId**(`surveyId`, `sessionId`): `Promise`\<\{ `completedAt`: `Date` \| `null`; `completionHandled`: `boolean` \| `null`; `createdAt`: `Date`; `currentQuestionIndex`: `number` \| `null`; `id`: `number`; `responses`: `unknown`; `sessionId`: `string`; `status`: `string`; `surveyId`: `number`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:627](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L627)

#### Parameters

##### surveyId

`number`

##### sessionId

`string`

#### Returns

`Promise`\<\{ `completedAt`: `Date` \| `null`; `completionHandled`: `boolean` \| `null`; `createdAt`: `Date`; `currentQuestionIndex`: `number` \| `null`; `id`: `number`; `responses`: `unknown`; `sessionId`: `string`; `status`: `string`; `surveyId`: `number`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

***

### getChatbotConfig()

> **getChatbotConfig**(`id`): `Promise`\<\{ `avatarUrl`: `string` \| `null`; `backgroundImageUrl`: `string` \| `null`; `createdAt`: `Date`; `description`: `string` \| `null`; `fallbackMessage`: `string` \| `null`; `formConfirmationMessage`: `string` \| `null`; `formRecipientEmail`: `string` \| `null`; `formRecipientName`: `string` \| `null`; `guid`: `string`; `homeScreenConfig`: `unknown`; `id`: `number`; `initialMessages`: `unknown`; `isActive`: `boolean` \| `null`; `maxTokens`: `number` \| `null`; `model`: `string`; `name`: `string`; `senderEmail`: `string` \| `null`; `senderName`: `string` \| `null`; `systemPrompt`: `string`; `temperature`: `number` \| `null`; `updatedAt`: `Date`; `userId`: `string`; `welcomeMessage`: `string` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:337](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L337)

#### Parameters

##### id

`number`

#### Returns

`Promise`\<\{ `avatarUrl`: `string` \| `null`; `backgroundImageUrl`: `string` \| `null`; `createdAt`: `Date`; `description`: `string` \| `null`; `fallbackMessage`: `string` \| `null`; `formConfirmationMessage`: `string` \| `null`; `formRecipientEmail`: `string` \| `null`; `formRecipientName`: `string` \| `null`; `guid`: `string`; `homeScreenConfig`: `unknown`; `id`: `number`; `initialMessages`: `unknown`; `isActive`: `boolean` \| `null`; `maxTokens`: `number` \| `null`; `model`: `string`; `name`: `string`; `senderEmail`: `string` \| `null`; `senderName`: `string` \| `null`; `systemPrompt`: `string`; `temperature`: `number` \| `null`; `updatedAt`: `Date`; `userId`: `string`; `welcomeMessage`: `string` \| `null`; \} \| `undefined`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getChatbotConfig`](../interfaces/IStorage.md#getchatbotconfig)

***

### getChatbotConfigByGuid()

> **getChatbotConfigByGuid**(`userId`, `guid`): `Promise`\<\{ `avatarUrl`: `string` \| `null`; `backgroundImageUrl`: `string` \| `null`; `createdAt`: `Date`; `description`: `string` \| `null`; `fallbackMessage`: `string` \| `null`; `formConfirmationMessage`: `string` \| `null`; `formRecipientEmail`: `string` \| `null`; `formRecipientName`: `string` \| `null`; `guid`: `string`; `homeScreenConfig`: `unknown`; `id`: `number`; `initialMessages`: `unknown`; `isActive`: `boolean` \| `null`; `maxTokens`: `number` \| `null`; `model`: `string`; `name`: `string`; `senderEmail`: `string` \| `null`; `senderName`: `string` \| `null`; `systemPrompt`: `string`; `temperature`: `number` \| `null`; `updatedAt`: `Date`; `userId`: `string`; `welcomeMessage`: `string` \| `null`; \} \| `null`\>

Defined in: [server/storage.ts:342](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L342)

#### Parameters

##### userId

`string`

##### guid

`string`

#### Returns

`Promise`\<\{ `avatarUrl`: `string` \| `null`; `backgroundImageUrl`: `string` \| `null`; `createdAt`: `Date`; `description`: `string` \| `null`; `fallbackMessage`: `string` \| `null`; `formConfirmationMessage`: `string` \| `null`; `formRecipientEmail`: `string` \| `null`; `formRecipientName`: `string` \| `null`; `guid`: `string`; `homeScreenConfig`: `unknown`; `id`: `number`; `initialMessages`: `unknown`; `isActive`: `boolean` \| `null`; `maxTokens`: `number` \| `null`; `model`: `string`; `name`: `string`; `senderEmail`: `string` \| `null`; `senderName`: `string` \| `null`; `systemPrompt`: `string`; `temperature`: `number` \| `null`; `updatedAt`: `Date`; `userId`: `string`; `welcomeMessage`: `string` \| `null`; \} \| `null`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getChatbotConfigByGuid`](../interfaces/IStorage.md#getchatbotconfigbyguid)

***

### getChatbotConfigByGuidPublic()

> **getChatbotConfigByGuidPublic**(`guid`): `Promise`\<\{ `avatarUrl`: `string` \| `null`; `backgroundImageUrl`: `string` \| `null`; `createdAt`: `Date`; `description`: `string` \| `null`; `fallbackMessage`: `string` \| `null`; `formConfirmationMessage`: `string` \| `null`; `formRecipientEmail`: `string` \| `null`; `formRecipientName`: `string` \| `null`; `guid`: `string`; `homeScreenConfig`: `unknown`; `id`: `number`; `initialMessages`: `unknown`; `isActive`: `boolean` \| `null`; `maxTokens`: `number` \| `null`; `model`: `string`; `name`: `string`; `senderEmail`: `string` \| `null`; `senderName`: `string` \| `null`; `systemPrompt`: `string`; `temperature`: `number` \| `null`; `updatedAt`: `Date`; `userId`: `string`; `welcomeMessage`: `string` \| `null`; \} \| `null`\>

Defined in: [server/storage.ts:348](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L348)

#### Parameters

##### guid

`string`

#### Returns

`Promise`\<\{ `avatarUrl`: `string` \| `null`; `backgroundImageUrl`: `string` \| `null`; `createdAt`: `Date`; `description`: `string` \| `null`; `fallbackMessage`: `string` \| `null`; `formConfirmationMessage`: `string` \| `null`; `formRecipientEmail`: `string` \| `null`; `formRecipientName`: `string` \| `null`; `guid`: `string`; `homeScreenConfig`: `unknown`; `id`: `number`; `initialMessages`: `unknown`; `isActive`: `boolean` \| `null`; `maxTokens`: `number` \| `null`; `model`: `string`; `name`: `string`; `senderEmail`: `string` \| `null`; `senderName`: `string` \| `null`; `systemPrompt`: `string`; `temperature`: `number` \| `null`; `updatedAt`: `Date`; `userId`: `string`; `welcomeMessage`: `string` \| `null`; \} \| `null`\>

***

### getChatbotConfigs()

> **getChatbotConfigs**(`userId`): `Promise`\<`object`[]\>

Defined in: [server/storage.ts:333](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L333)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`object`[]\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getChatbotConfigs`](../interfaces/IStorage.md#getchatbotconfigs)

***

### getChatSession()

> **getChatSession**(`sessionId`): `Promise`\<\{ `activeSurveyId`: `number` \| `null`; `chatbotConfigId`: `number` \| `null`; `createdAt`: `Date`; `id`: `number`; `sessionId`: `string`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:170](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L170)

#### Parameters

##### sessionId

`string`

#### Returns

`Promise`\<\{ `activeSurveyId`: `number` \| `null`; `chatbotConfigId`: `number` \| `null`; `createdAt`: `Date`; `id`: `number`; `sessionId`: `string`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getChatSession`](../interfaces/IStorage.md#getchatsession)

***

### getChatSessionsByChatbotGuid()

> **getChatSessionsByChatbotGuid**(`chatbotGuid`, `offset?`, `limit?`): `Promise`\<`object`[]\>

Defined in: [server/storage.ts:175](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L175)

#### Parameters

##### chatbotGuid

`string`

##### offset?

`number`

##### limit?

`number`

#### Returns

`Promise`\<`object`[]\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getChatSessionsByChatbotGuid`](../interfaces/IStorage.md#getchatsessionsbychatbotguid)

***

### getChatSessionsCountByChatbotGuid()

> **getChatSessionsCountByChatbotGuid**(`chatbotGuid`): `Promise`\<`number`\>

Defined in: [server/storage.ts:263](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L263)

#### Parameters

##### chatbotGuid

`string`

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getChatSessionsCountByChatbotGuid`](../interfaces/IStorage.md#getchatsessionscountbychatbotguid)

***

### getChatSessionsWithMultipleMessagesByChatbotGuid()

> **getChatSessionsWithMultipleMessagesByChatbotGuid**(`chatbotGuid`, `offset?`, `limit?`): `Promise`\<`object`[]\>

Defined in: [server/storage.ts:200](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L200)

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

### getChatSessionsWithMultipleMessagesCountByChatbotGuid()

> **getChatSessionsWithMultipleMessagesCountByChatbotGuid**(`chatbotGuid`): `Promise`\<`number`\>

Defined in: [server/storage.ts:272](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L272)

#### Parameters

##### chatbotGuid

`string`

#### Returns

`Promise`\<`number`\>

***

### getConversationCount()

> **getConversationCount**(`userId`): `Promise`\<`number`\>

Defined in: [server/storage.ts:672](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L672)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getConversationCount`](../interfaces/IStorage.md#getconversationcount)

***

### getMessages()

> **getMessages**(`sessionId`): `Promise`\<`object`[]\>

Defined in: [server/storage.ts:311](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L311)

#### Parameters

##### sessionId

`string`

#### Returns

`Promise`\<`object`[]\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getMessages`](../interfaces/IStorage.md#getmessages)

***

### getOrCreateFreeSubscription()

> **getOrCreateFreeSubscription**(`userId`): `Promise`\<`object` & `object`\>

Defined in: [server/storage.ts:805](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L805)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`object` & `object`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getOrCreateFreeSubscription`](../interfaces/IStorage.md#getorcreatefreesubscription)

***

### getRecentMessages()

> **getRecentMessages**(`sessionId`, `limit`): `Promise`\<`object`[]\>

Defined in: [server/storage.ts:323](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L323)

#### Parameters

##### sessionId

`string`

##### limit

`number` = `50`

#### Returns

`Promise`\<`object`[]\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getRecentMessages`](../interfaces/IStorage.md#getrecentmessages)

***

### getSubscriptionByStripeId()

> **getSubscriptionByStripeId**(`stripeSubscriptionId`): `Promise`\<\{ `cancelAtPeriodEnd`: `boolean` \| `null`; `createdAt`: `Date`; `currentPeriodEnd`: `Date` \| `null`; `currentPeriodStart`: `Date` \| `null`; `id`: `number`; `messagesUsedThisMonth`: `number` \| `null`; `planId`: `number`; `status`: `string`; `stripeCustomerId`: `string` \| `null`; `stripeSubscriptionId`: `string` \| `null`; `updatedAt`: `Date`; `userId`: `string`; \} \| `undefined`\>

Defined in: [server/storage.ts:726](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L726)

#### Parameters

##### stripeSubscriptionId

`string`

#### Returns

`Promise`\<\{ `cancelAtPeriodEnd`: `boolean` \| `null`; `createdAt`: `Date`; `currentPeriodEnd`: `Date` \| `null`; `currentPeriodStart`: `Date` \| `null`; `id`: `number`; `messagesUsedThisMonth`: `number` \| `null`; `planId`: `number`; `status`: `string`; `stripeCustomerId`: `string` \| `null`; `stripeSubscriptionId`: `string` \| `null`; `updatedAt`: `Date`; `userId`: `string`; \} \| `undefined`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getSubscriptionByStripeId`](../interfaces/IStorage.md#getsubscriptionbystripeid)

***

### getSubscriptionPlan()

> **getSubscriptionPlan**(`id`): `Promise`\<\{ `billingInterval`: `string`; `createdAt`: `Date`; `currency`: `string`; `description`: `string` \| `null`; `features`: `unknown`; `id`: `number`; `isActive`: `boolean` \| `null`; `maxBots`: `number`; `maxMessagesPerMonth`: `number`; `name`: `string`; `price`: `number`; `stripePriceId`: `string`; `stripeProductId`: `string`; `updatedAt`: `Date`; \} \| `undefined`\>

Defined in: [server/storage.ts:695](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L695)

#### Parameters

##### id

`number`

#### Returns

`Promise`\<\{ `billingInterval`: `string`; `createdAt`: `Date`; `currency`: `string`; `description`: `string` \| `null`; `features`: `unknown`; `id`: `number`; `isActive`: `boolean` \| `null`; `maxBots`: `number`; `maxMessagesPerMonth`: `number`; `name`: `string`; `price`: `number`; `stripePriceId`: `string`; `stripeProductId`: `string`; `updatedAt`: `Date`; \} \| `undefined`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getSubscriptionPlan`](../interfaces/IStorage.md#getsubscriptionplan)

***

### getSubscriptionPlans()

> **getSubscriptionPlans**(): `Promise`\<`object`[]\>

Defined in: [server/storage.ts:689](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L689)

#### Returns

`Promise`\<`object`[]\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getSubscriptionPlans`](../interfaces/IStorage.md#getsubscriptionplans)

***

### getSurvey()

> **getSurvey**(`id`): `Promise`\<\{ `chatbotConfigId`: `number`; `createdAt`: `Date`; `description`: `string` \| `null`; `id`: `number`; `name`: `string`; `status`: `string`; `surveyConfig`: `unknown`; `updatedAt`: `Date`; \} \| `undefined`\>

Defined in: [server/storage.ts:550](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L550)

#### Parameters

##### id

`number`

#### Returns

`Promise`\<\{ `chatbotConfigId`: `number`; `createdAt`: `Date`; `description`: `string` \| `null`; `id`: `number`; `name`: `string`; `status`: `string`; `surveyConfig`: `unknown`; `updatedAt`: `Date`; \} \| `undefined`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getSurvey`](../interfaces/IStorage.md#getsurvey)

***

### getSurveyAnalyticsByChatbotGuid()

> **getSurveyAnalyticsByChatbotGuid**(`chatbotGuid`): `Promise`\<\{ `averageCompletionTime`: `number`; `completionRate`: `number`; `surveyBreakdown`: `object`[]; `totalResponses`: `number`; `totalSurveys`: `number`; \}\>

Defined in: [server/storage.ts:887](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L887)

#### Parameters

##### chatbotGuid

`string`

#### Returns

`Promise`\<\{ `averageCompletionTime`: `number`; `completionRate`: `number`; `surveyBreakdown`: `object`[]; `totalResponses`: `number`; `totalSurveys`: `number`; \}\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getSurveyAnalyticsByChatbotGuid`](../interfaces/IStorage.md#getsurveyanalyticsbychatbotguid)

***

### getSurveys()

> **getSurveys**(`chatbotConfigId`): `Promise`\<`object`[]\>

Defined in: [server/storage.ts:544](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L544)

#### Parameters

##### chatbotConfigId

`number`

#### Returns

`Promise`\<`object`[]\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getSurveys`](../interfaces/IStorage.md#getsurveys)

***

### getSurveySession()

> **getSurveySession**(`surveyId`, `sessionId`): `Promise`\<\{ `completedAt`: `Date` \| `null`; `completionHandled`: `boolean` \| `null`; `createdAt`: `Date`; `currentQuestionIndex`: `number` \| `null`; `id`: `number`; `responses`: `unknown`; `sessionId`: `string`; `status`: `string`; `surveyId`: `number`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:598](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L598)

#### Parameters

##### surveyId

`number`

##### sessionId

`string`

#### Returns

`Promise`\<\{ `completedAt`: `Date` \| `null`; `completionHandled`: `boolean` \| `null`; `createdAt`: `Date`; `currentQuestionIndex`: `number` \| `null`; `id`: `number`; `responses`: `unknown`; `sessionId`: `string`; `status`: `string`; `surveyId`: `number`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getSurveySession`](../interfaces/IStorage.md#getsurveysession)

***

### getSurveySessionBySessionId()

> **getSurveySessionBySessionId**(`sessionId`): `Promise`\<\{ `completedAt`: `Date` \| `null`; `completionHandled`: `boolean` \| `null`; `createdAt`: `Date`; `currentQuestionIndex`: `number` \| `null`; `id`: `number`; `responses`: `unknown`; `sessionId`: `string`; `status`: `string`; `surveyId`: `number`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:621](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L621)

#### Parameters

##### sessionId

`string`

#### Returns

`Promise`\<\{ `completedAt`: `Date` \| `null`; `completionHandled`: `boolean` \| `null`; `createdAt`: `Date`; `currentQuestionIndex`: `number` \| `null`; `id`: `number`; `responses`: `unknown`; `sessionId`: `string`; `status`: `string`; `surveyId`: `number`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getSurveySessionBySessionId`](../interfaces/IStorage.md#getsurveysessionbysessionid)

***

### getUser()

> **getUser**(`id`): `Promise`\<\{ `createdAt`: `Date` \| `null`; `email`: `string` \| `null`; `firstName`: `string` \| `null`; `id`: `string`; `lastName`: `string` \| `null`; `profileImageUrl`: `string` \| `null`; `updatedAt`: `Date` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:149](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L149)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<\{ `createdAt`: `Date` \| `null`; `email`: `string` \| `null`; `firstName`: `string` \| `null`; `id`: `string`; `lastName`: `string` \| `null`; `profileImageUrl`: `string` \| `null`; `updatedAt`: `Date` \| `null`; \} \| `undefined`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getUser`](../interfaces/IStorage.md#getuser)

***

### getUserSubscription()

> **getUserSubscription**(`userId`): `Promise`\<\{ `cancelAtPeriodEnd`: `boolean` \| `null`; `createdAt`: `Date`; `currentPeriodEnd`: `Date` \| `null`; `currentPeriodStart`: `Date` \| `null`; `id`: `number`; `messagesUsedThisMonth`: `number` \| `null`; `planId`: `number`; `status`: `string`; `stripeCustomerId`: `string` \| `null`; `stripeSubscriptionId`: `string` \| `null`; `updatedAt`: `Date`; `userId`: `string`; \} \| `undefined`\>

Defined in: [server/storage.ts:718](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L718)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<\{ `cancelAtPeriodEnd`: `boolean` \| `null`; `createdAt`: `Date`; `currentPeriodEnd`: `Date` \| `null`; `currentPeriodStart`: `Date` \| `null`; `id`: `number`; `messagesUsedThisMonth`: `number` \| `null`; `planId`: `number`; `status`: `string`; `stripeCustomerId`: `string` \| `null`; `stripeSubscriptionId`: `string` \| `null`; `updatedAt`: `Date`; `userId`: `string`; \} \| `undefined`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getUserSubscription`](../interfaces/IStorage.md#getusersubscription)

***

### getUserSubscriptionWithPlan()

> **getUserSubscriptionWithPlan**(`userId`): `Promise`\<`object` & `object` \| `undefined`\>

Defined in: [server/storage.ts:759](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L759)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`object` & `object` \| `undefined`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getUserSubscriptionWithPlan`](../interfaces/IStorage.md#getusersubscriptionwithplan)

***

### getWebsiteContents()

> **getWebsiteContents**(`websiteSourceId`): `Promise`\<`object`[]\>

Defined in: [server/storage.ts:449](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L449)

#### Parameters

##### websiteSourceId

`number`

#### Returns

`Promise`\<`object`[]\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getWebsiteContents`](../interfaces/IStorage.md#getwebsitecontents)

***

### getWebsiteSource()

> **getWebsiteSource**(`id`): `Promise`\<\{ `chatbotConfigId`: `number`; `createdAt`: `Date`; `description`: `string` \| `null`; `errorMessage`: `string` \| `null`; `fileName`: `string` \| `null`; `id`: `number`; `lastScanned`: `Date` \| `null`; `maxPages`: `number` \| `null`; `sitemapUrl`: `string` \| `null`; `sourceType`: `string`; `status`: `string`; `textContent`: `string` \| `null`; `title`: `string` \| `null`; `totalPages`: `number` \| `null`; `updatedAt`: `Date`; `url`: `string` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:419](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L419)

#### Parameters

##### id

`number`

#### Returns

`Promise`\<\{ `chatbotConfigId`: `number`; `createdAt`: `Date`; `description`: `string` \| `null`; `errorMessage`: `string` \| `null`; `fileName`: `string` \| `null`; `id`: `number`; `lastScanned`: `Date` \| `null`; `maxPages`: `number` \| `null`; `sitemapUrl`: `string` \| `null`; `sourceType`: `string`; `status`: `string`; `textContent`: `string` \| `null`; `title`: `string` \| `null`; `totalPages`: `number` \| `null`; `updatedAt`: `Date`; `url`: `string` \| `null`; \} \| `undefined`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getWebsiteSource`](../interfaces/IStorage.md#getwebsitesource)

***

### getWebsiteSources()

> **getWebsiteSources**(`chatbotConfigId`): `Promise`\<`object`[]\>

Defined in: [server/storage.ts:413](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L413)

#### Parameters

##### chatbotConfigId

`number`

#### Returns

`Promise`\<`object`[]\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`getWebsiteSources`](../interfaces/IStorage.md#getwebsitesources)

***

### incrementMessageUsage()

> **incrementMessageUsage**(`userId`): `Promise`\<`void`\>

Defined in: [server/storage.ts:785](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L785)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`incrementMessageUsage`](../interfaces/IStorage.md#incrementmessageusage)

***

### resetMonthlyMessageUsage()

> **resetMonthlyMessageUsage**(`userId`): `Promise`\<`void`\>

Defined in: [server/storage.ts:795](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L795)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`resetMonthlyMessageUsage`](../interfaces/IStorage.md#resetmonthlymessageusage)

***

### searchSimilarContent()

> **searchSimilarContent**(`chatbotConfigId`, `query`, `limit`): `Promise`\<`object`[]\>

Defined in: [server/storage.ts:466](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L466)

#### Parameters

##### chatbotConfigId

`number`

##### query

`string`

##### limit

`number` = `3`

#### Returns

`Promise`\<`object`[]\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`searchSimilarContent`](../interfaces/IStorage.md#searchsimilarcontent)

***

### setActiveSurvey()

> **setActiveSurvey**(`sessionId`, `surveyId`): `Promise`\<\{ `activeSurveyId`: `number` \| `null`; `chatbotConfigId`: `number` \| `null`; `createdAt`: `Date`; `id`: `number`; `sessionId`: `string`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:638](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L638)

#### Parameters

##### sessionId

`string`

##### surveyId

`number` | `null`

#### Returns

`Promise`\<\{ `activeSurveyId`: `number` \| `null`; `chatbotConfigId`: `number` \| `null`; `createdAt`: `Date`; `id`: `number`; `sessionId`: `string`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`setActiveSurvey`](../interfaces/IStorage.md#setactivesurvey)

***

### updateChatbotConfig()

> **updateChatbotConfig**(`id`, `data`): `Promise`\<\{ `avatarUrl`: `string` \| `null`; `backgroundImageUrl`: `string` \| `null`; `createdAt`: `Date`; `description`: `string` \| `null`; `fallbackMessage`: `string` \| `null`; `formConfirmationMessage`: `string` \| `null`; `formRecipientEmail`: `string` \| `null`; `formRecipientName`: `string` \| `null`; `guid`: `string`; `homeScreenConfig`: `unknown`; `id`: `number`; `initialMessages`: `unknown`; `isActive`: `boolean` \| `null`; `maxTokens`: `number` \| `null`; `model`: `string`; `name`: `string`; `senderEmail`: `string` \| `null`; `senderName`: `string` \| `null`; `systemPrompt`: `string`; `temperature`: `number` \| `null`; `updatedAt`: `Date`; `userId`: `string`; `welcomeMessage`: `string` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:361](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L361)

#### Parameters

##### id

`number`

##### data

`Partial`\<[`ChatbotConfig`](../../../shared/schema/type-aliases/ChatbotConfig.md)\>

#### Returns

`Promise`\<\{ `avatarUrl`: `string` \| `null`; `backgroundImageUrl`: `string` \| `null`; `createdAt`: `Date`; `description`: `string` \| `null`; `fallbackMessage`: `string` \| `null`; `formConfirmationMessage`: `string` \| `null`; `formRecipientEmail`: `string` \| `null`; `formRecipientName`: `string` \| `null`; `guid`: `string`; `homeScreenConfig`: `unknown`; `id`: `number`; `initialMessages`: `unknown`; `isActive`: `boolean` \| `null`; `maxTokens`: `number` \| `null`; `model`: `string`; `name`: `string`; `senderEmail`: `string` \| `null`; `senderName`: `string` \| `null`; `systemPrompt`: `string`; `temperature`: `number` \| `null`; `updatedAt`: `Date`; `userId`: `string`; `welcomeMessage`: `string` \| `null`; \} \| `undefined`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`updateChatbotConfig`](../interfaces/IStorage.md#updatechatbotconfig)

***

### updateChatSession()

> **updateChatSession**(`sessionId`, `data`): `Promise`\<\{ `activeSurveyId`: `number` \| `null`; `chatbotConfigId`: `number` \| `null`; `createdAt`: `Date`; `id`: `number`; `sessionId`: `string`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:243](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L243)

#### Parameters

##### sessionId

`string`

##### data

`Partial`\<[`ChatSession`](../../../shared/schema/type-aliases/ChatSession.md)\>

#### Returns

`Promise`\<\{ `activeSurveyId`: `number` \| `null`; `chatbotConfigId`: `number` \| `null`; `createdAt`: `Date`; `id`: `number`; `sessionId`: `string`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`updateChatSession`](../interfaces/IStorage.md#updatechatsession)

***

### updateSubscription()

> **updateSubscription**(`id`, `data`): `Promise`\<\{ `cancelAtPeriodEnd`: `boolean` \| `null`; `createdAt`: `Date`; `currentPeriodEnd`: `Date` \| `null`; `currentPeriodStart`: `Date` \| `null`; `id`: `number`; `messagesUsedThisMonth`: `number` \| `null`; `planId`: `number`; `status`: `string`; `stripeCustomerId`: `string` \| `null`; `stripeSubscriptionId`: `string` \| `null`; `updatedAt`: `Date`; `userId`: `string`; \} \| `undefined`\>

Defined in: [server/storage.ts:741](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L741)

#### Parameters

##### id

`number`

##### data

`Partial`\<[`Subscription`](../../../shared/schema/type-aliases/Subscription.md)\>

#### Returns

`Promise`\<\{ `cancelAtPeriodEnd`: `boolean` \| `null`; `createdAt`: `Date`; `currentPeriodEnd`: `Date` \| `null`; `currentPeriodStart`: `Date` \| `null`; `id`: `number`; `messagesUsedThisMonth`: `number` \| `null`; `planId`: `number`; `status`: `string`; `stripeCustomerId`: `string` \| `null`; `stripeSubscriptionId`: `string` \| `null`; `updatedAt`: `Date`; `userId`: `string`; \} \| `undefined`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`updateSubscription`](../interfaces/IStorage.md#updatesubscription)

***

### updateSubscriptionByStripeId()

> **updateSubscriptionByStripeId**(`stripeSubscriptionId`, `data`): `Promise`\<\{ `cancelAtPeriodEnd`: `boolean` \| `null`; `createdAt`: `Date`; `currentPeriodEnd`: `Date` \| `null`; `currentPeriodStart`: `Date` \| `null`; `id`: `number`; `messagesUsedThisMonth`: `number` \| `null`; `planId`: `number`; `status`: `string`; `stripeCustomerId`: `string` \| `null`; `stripeSubscriptionId`: `string` \| `null`; `updatedAt`: `Date`; `userId`: `string`; \} \| `undefined`\>

Defined in: [server/storage.ts:750](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L750)

#### Parameters

##### stripeSubscriptionId

`string`

##### data

`Partial`\<[`Subscription`](../../../shared/schema/type-aliases/Subscription.md)\>

#### Returns

`Promise`\<\{ `cancelAtPeriodEnd`: `boolean` \| `null`; `createdAt`: `Date`; `currentPeriodEnd`: `Date` \| `null`; `currentPeriodStart`: `Date` \| `null`; `id`: `number`; `messagesUsedThisMonth`: `number` \| `null`; `planId`: `number`; `status`: `string`; `stripeCustomerId`: `string` \| `null`; `stripeSubscriptionId`: `string` \| `null`; `updatedAt`: `Date`; `userId`: `string`; \} \| `undefined`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`updateSubscriptionByStripeId`](../interfaces/IStorage.md#updatesubscriptionbystripeid)

***

### updateSubscriptionPlan()

> **updateSubscriptionPlan**(`id`, `data`): `Promise`\<\{ `billingInterval`: `string`; `createdAt`: `Date`; `currency`: `string`; `description`: `string` \| `null`; `features`: `unknown`; `id`: `number`; `isActive`: `boolean` \| `null`; `maxBots`: `number`; `maxMessagesPerMonth`: `number`; `name`: `string`; `price`: `number`; `stripePriceId`: `string`; `stripeProductId`: `string`; `updatedAt`: `Date`; \} \| `undefined`\>

Defined in: [server/storage.ts:708](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L708)

#### Parameters

##### id

`number`

##### data

`Partial`\<[`SubscriptionPlan`](../../../shared/schema/type-aliases/SubscriptionPlan.md)\>

#### Returns

`Promise`\<\{ `billingInterval`: `string`; `createdAt`: `Date`; `currency`: `string`; `description`: `string` \| `null`; `features`: `unknown`; `id`: `number`; `isActive`: `boolean` \| `null`; `maxBots`: `number`; `maxMessagesPerMonth`: `number`; `name`: `string`; `price`: `number`; `stripePriceId`: `string`; `stripeProductId`: `string`; `updatedAt`: `Date`; \} \| `undefined`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`updateSubscriptionPlan`](../interfaces/IStorage.md#updatesubscriptionplan)

***

### updateSurvey()

> **updateSurvey**(`id`, `data`): `Promise`\<\{ `chatbotConfigId`: `number`; `createdAt`: `Date`; `description`: `string` \| `null`; `id`: `number`; `name`: `string`; `status`: `string`; `surveyConfig`: `unknown`; `updatedAt`: `Date`; \} \| `undefined`\>

Defined in: [server/storage.ts:563](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L563)

#### Parameters

##### id

`number`

##### data

`Partial`\<[`Survey`](../../../shared/schema/type-aliases/Survey.md)\>

#### Returns

`Promise`\<\{ `chatbotConfigId`: `number`; `createdAt`: `Date`; `description`: `string` \| `null`; `id`: `number`; `name`: `string`; `status`: `string`; `surveyConfig`: `unknown`; `updatedAt`: `Date`; \} \| `undefined`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`updateSurvey`](../interfaces/IStorage.md#updatesurvey)

***

### updateSurveySession()

> **updateSurveySession**(`id`, `data`): `Promise`\<\{ `completedAt`: `Date` \| `null`; `completionHandled`: `boolean` \| `null`; `createdAt`: `Date`; `currentQuestionIndex`: `number` \| `null`; `id`: `number`; `responses`: `unknown`; `sessionId`: `string`; `status`: `string`; `surveyId`: `number`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:612](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L612)

#### Parameters

##### id

`number`

##### data

`Partial`\<[`SurveySession`](../../../shared/schema/type-aliases/SurveySession.md)\>

#### Returns

`Promise`\<\{ `completedAt`: `Date` \| `null`; `completionHandled`: `boolean` \| `null`; `createdAt`: `Date`; `currentQuestionIndex`: `number` \| `null`; `id`: `number`; `responses`: `unknown`; `sessionId`: `string`; `status`: `string`; `surveyId`: `number`; `updatedAt`: `Date`; `userId`: `string` \| `null`; \} \| `undefined`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`updateSurveySession`](../interfaces/IStorage.md#updatesurveysession)

***

### updateWebsiteSource()

> **updateWebsiteSource**(`id`, `data`): `Promise`\<\{ `chatbotConfigId`: `number`; `createdAt`: `Date`; `description`: `string` \| `null`; `errorMessage`: `string` \| `null`; `fileName`: `string` \| `null`; `id`: `number`; `lastScanned`: `Date` \| `null`; `maxPages`: `number` \| `null`; `sitemapUrl`: `string` \| `null`; `sourceType`: `string`; `status`: `string`; `textContent`: `string` \| `null`; `title`: `string` \| `null`; `totalPages`: `number` \| `null`; `updatedAt`: `Date`; `url`: `string` \| `null`; \} \| `undefined`\>

Defined in: [server/storage.ts:432](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L432)

#### Parameters

##### id

`number`

##### data

`Partial`\<[`WebsiteSource`](../../../shared/schema/type-aliases/WebsiteSource.md)\>

#### Returns

`Promise`\<\{ `chatbotConfigId`: `number`; `createdAt`: `Date`; `description`: `string` \| `null`; `errorMessage`: `string` \| `null`; `fileName`: `string` \| `null`; `id`: `number`; `lastScanned`: `Date` \| `null`; `maxPages`: `number` \| `null`; `sitemapUrl`: `string` \| `null`; `sourceType`: `string`; `status`: `string`; `textContent`: `string` \| `null`; `title`: `string` \| `null`; `totalPages`: `number` \| `null`; `updatedAt`: `Date`; `url`: `string` \| `null`; \} \| `undefined`\>

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`updateWebsiteSource`](../interfaces/IStorage.md#updatewebsitesource)

***

### upsertUser()

> **upsertUser**(`userData`): `Promise`\<\{ `createdAt`: `Date` \| `null`; `email`: `string` \| `null`; `firstName`: `string` \| `null`; `id`: `string`; `lastName`: `string` \| `null`; `profileImageUrl`: `string` \| `null`; `updatedAt`: `Date` \| `null`; \}\>

Defined in: [server/storage.ts:154](https://github.com/MikPoik/BotTailor/blob/07fc3d9455499b488340dcc81c4af5140dcc86d5/server/storage.ts#L154)

#### Parameters

##### userData

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

#### Implementation of

[`IStorage`](../interfaces/IStorage.md).[`upsertUser`](../interfaces/IStorage.md#upsertuser)
