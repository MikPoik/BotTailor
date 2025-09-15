# replit.md

## Overview

This project is a full-stack React chat widget application featuring an Express.js backend and a React frontend. Its primary purpose is to provide an embeddable customer support chat widget for any website. The widget supports rich messaging, including text, interactive cards, menus, and quick replies, aiming to offer a comprehensive and customizable communication tool for businesses. The vision is to enable seamless integration of sophisticated chat functionalities, enhancing user engagement and support capabilities across various web platforms.

## Cost-Effective Development Workflow

**Target: 3-5 tool calls maximum**

## Core Rules

**Before Acting:** Plan ALL reads + edits mentally first
**Information:** Batch all file reads in 1 call (predict what you need)
**Changes:** Use multi_edit for everything, batch parallel edits
**Verification:** Trust dev tools, stop when they confirm success

## Critical Batching

**Phase 1:** read(file1) + read(file2) + grep(pattern) + diagnostics() [1 call]
**Phase 2:** multi_edit(file1) + multi_edit(file2) + bash() [1-2 calls]
**Phase 3:** restart_workflow() only if runtime fails [0-1 call]

## Anti-Patterns ❌
- Sequential: read → analyze → read more → edit
- Multiple edits to same file
- Verification anxiety (checking working changes)
- Using architect for normal development

## ZERO DELEGATION RULE 🚫

**NEVER USE:**
- `start_subagent` - Execute everything yourself
- `write_task_list` - Plan mentally, act directly  
- `architect` - Only for genuine 3+ attempt failures

**WHY:** Sub-agents cost 2x+ tool calls via context transfer + cold starts

**ALWAYS:** Direct execution with batched tools = 3-5 calls total

## Surgical Precision
- **UI issues:** component + parent + hooks
- **API issues:** routes + services + schema  
- **Data issues:** schema + storage + endpoints
- **Errors:** Follow stack trace to deepest frame, work bottom-up, try the simplest fix, switch layers when stuck

## Stop Conditions
- HMR reload success
- Console shows expected behavior
- LSP errors cleared
- Dev server responds correctly

**Success metric:** Fix root cause with pattern-based changes in minimum tool calls

## User Preferences

Preferred communication style: Simple, everyday language.

### Notes for agent

For server routes, create modular structure with separation of concerns
Use modular design for features
UI design choices should be mobile first unless stated otherwise.
If you need to use OpenAI models, model "gpt-4.1" is the newest model released on 14.4.2025


  
## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **UI/UX Decisions**: Mobile-first responsive design; customizable floating chat bubble, full-featured chat UI with message bubbles, typing indicators, and rich content support. Theming is controlled via a color resolution system that prioritizes embed parameters, then UI Designer theme settings, and finally default CSS values. Background images can be uploaded and displayed on the home screen with text readability overlay.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ESM modules
- **Database ORM**: Drizzle ORM for PostgreSQL
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: In-memory storage with interface for database persistence

### System Design Choices
- **Chat Widget System**: Features a customizable floating chat bubble (bottom-right/bottom-left) and a full-featured chat interface supporting text messages, interactive cards, menu options, and quick replies.
- **Message System**: Supports rich messages with images, titles, descriptions, action buttons, interactive menus, and quick replies. Uses polling for real-time updates.
- **Data Flow**: Sessions are initialized by the client, followed by a welcome message from the server. Message exchange occurs in real-time via polling. The server can send structured messages with interactive elements, and client selections trigger server responses.
- **Database Schema**: Includes Users (authentication), Chat Sessions (session management), and Messages (rich content via JSON metadata).
- **Theming System**: Implements a complete color priority system where embed parameters override UI Designer theme settings, which in turn override default CSS. Includes support for primary, background, and text colors, and background images. Email configuration for form submissions is integrated, allowing form functionality to be conditional on proper email setup.
- **Real-time Communication**: Uses HTTP polling for message synchronization, chosen for simpler deployment and broader compatibility over WebSockets.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **express**: Web server framework
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework

### Development Tools (for context, not integrated into production build)
- **tsx**: TypeScript execution for development
- **vite**: Frontend build tool with HMR
- **esbuild**: Backend bundling for production
- **@replit/vite-plugin-runtime-error-modal**: Development error handling

### Source tree

Source Code Tree with Directory Structure:
============================================================
├── 📁 client/
│   └── 📁 src/
│       ├── 📄 App.tsx
│       │   ⚡ AuthenticatedRouter(): Element
│       │   ⚡ Router(): Element
│       │   ⚡ App(): Element
│       ├── 📁 components/
│       │   ├── 📁 chat/
│       │   │   ├── 📄 chat-interface.tsx
│       │   │   │   ⚡ export ChatInterface({ sessionId, isMobile, isPreloaded = false, chatbotConfig }: ChatInterfaceProps): Element
│       │   │   │   📋 ChatInterfaceProps
│       │   │   ├── 📄 chat-widget.tsx
│       │   │   │   ⚡ export ChatWidget({ 
  sessionId, 
  position = 'bottom-right',
  primaryColor = '#2563eb',
  backgroundColor = '#ffffff',
  textColor = '#1f2937',
  chatbotConfig
}: ChatWidgetProps): Element
│       │   │   │   📋 ChatWidgetProps
│       │   │   ├── 📄 home-tab.tsx
│       │   │   │   ⚡ export HomeTab({
  onStartChat,
  isMobile,
  isPreloaded = false,
  chatbotConfig,
}: HomeTabProps): Element
│       │   │   │   📋 HomeTabProps
│       │   │   │   📋 ChatTopic
│       │   │   ├── 📄 message-bubble.tsx
│       │   │   │   ⚡ parseMarkdown(text: string): string
│       │   │   │   ⚡ export MessageBubble({ message, onOptionSelect, onQuickReply, chatbotConfig, sessionId }: MessageBubbleProps): Element
│       │   │   │   📋 MessageBubbleProps
│       │   │   ├── 📄 prompt-assistant-chatbox.tsx
│       │   │   │   ⚡ extractSystemPrompt(content: string): string
│       │   │   │   ⚡ export PromptAssistantChatbox({ 
  currentPrompt, 
  onPromptGenerated, 
  chatbotConfig,
  chatbotGuid 
}: PromptAssistantChatboxProps): Element
│       │   │   │   📋 PromptAssistantMessage
│       │   │   │   📋 PromptAssistantChatboxProps
│       │   │   ├── 📄 rich-message.tsx
│       │   │   │   ⚡ parseMarkdown(text: string): string
│       │   │   │   ⚡ export RichMessage({ message, onOptionSelect, onQuickReply, chatbotConfig, sessionId }: RichMessageProps): Element
│       │   │   │   📋 RichMessageProps
│       │   │   ├── 📄 streaming-message.tsx
│       │   │   │   ⚡ export StreamingMessage({ 
  message, 
  onOptionSelect, 
  onQuickReply,
  chatbotConfig,
  sessionId
}: StreamingMessageProps): Element
│       │   │   │   📋 MessageChunk
│       │   │   │   📋 StreamingMessageProps
│       │   │   ├── 📄 tabbed-chat-interface.tsx
│       │   │   │   ⚡ resolveColors(): { primaryColor: string; backgroundColor: string; textColor: string; }
│       │   │   │   ⚡ export TabbedChatInterface({
  sessionId,
  isMobile,
  isPreloaded = false,
  onClose,
  isEmbedded = false,
  chatbotConfigId,
  chatbotConfig,
}: TabbedChatInterfaceProps): Element
│       │   │   │   📋 TabbedChatInterfaceProps
│       │   │   └── 📄 typing-indicator.tsx
│       │   │       ⚡ export TypingIndicator({ chatbotConfig }: TypingIndicatorProps): Element
│       │   │       📋 TypingIndicatorProps
│       │   ├── 📄 navbar.tsx
│       │   │   ⚡ export Navbar(): Element
│       │   ├── 📄 theme-toggle.tsx
│       │   │   ⚡ export ThemeToggle(): Element
│       │   └── 📁 ui-designer/
│       │       ├── 📄 component-registry.tsx
│       │       │   ⚡ export getIcon(iconName: string): Element
│       │       │   ⚡ export HeaderComponent({ component, resolvedColors }: ComponentRegistryProps): Element
│       │       │   ⚡ export CategoryTabsComponent({ component, resolvedColors }: ComponentRegistryProps): Element | null
│       │       │   ⚡ export TopicGridComponent({ component, onTopicClick, resolvedColors }: ComponentRegistryProps): Element | null
│       │       │   ⚡ export QuickActionsComponent({ component, onActionClick, resolvedColors }: ComponentRegistryProps): Element | null
│       │       │   ⚡ export FooterComponent({ component, resolvedColors }: ComponentRegistryProps): Element
│       │       │   ⚡ export renderComponent(component: HomeScreenComponent, onTopicClick?: (topic: any) => void, onActionClick?: (action: any) => void, resolvedColors?: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
  }): Element | null
│       │       │   📋 ComponentRegistryProps
│       │       └── 📄 dynamic-home-screen.tsx
│       │           ⚡ resolveColors(config: HomeScreenConfig): { primaryColor: any; backgroundColor: any; textColor: any; }
│       │           ⚡ export DynamicHomeScreen({ 
  config, 
  onTopicClick, 
  onActionClick, 
  className 
}: DynamicHomeScreenProps): Element
│       │           📋 DynamicHomeScreenProps
│       ├── 📁 contexts/
│       │   └── 📄 theme-context.tsx
│       │       ⚡ export ThemeProvider({ children }: { children: React.ReactNode }): Element
│       │       ⚡ export useTheme(): ThemeContextType
│       │       📋 ThemeContextType
│       ├── 📁 hooks/
│       │   ├── 📄 use-chat.ts
│       │   │   ⚡ export useChat(sessionId: string, chatbotConfigId?: number): { messages: Message[]; sendMessage: (content: string) => Promise<any>; sendStreamingMessage: (userDisplayText: string, onBubbleReceived?: ((message: Message) => void) | undefined, onAllComplete?: ((messages: Message[]) => void) | undefined, onError?: ((error: string) => void) | undefined, internalMessage?: string | ...
│       │   ├── 📄 use-mobile.tsx
│       │   │   ⚡ export useIsMobile(): boolean
│       │   ├── 📄 use-toast.ts
│       │   │   ⚡ genId(): string
│       │   │   ➡️ addToRemoveQueue(toastId: string): void
│       │   │   ➡️ export reducer(state: State, action: Action): State
│       │   │   ⚡ dispatch(action: Action): void
│       │   │   ⚡ toast({ ...props }: Toast): { id: string; dismiss: () => void; update: (props: any) => void; }
│       │   │   ⚡ useToast(): { toast: ({ ...props }: Toast) => { id: string; dismiss: () => void; update: (props: any) => void; }; dismiss: (toastId?: string | undefined) => void; toasts: any[]; }
│       │   │   📋 State
│       │   └── 📄 useAuth.ts
│       │       ⚡ export useAuth(): { user: unknown; isLoading: boolean; isAuthenticated: boolean; error: Error | null; }
│       ├── 📁 lib/
│       │   ├── 📄 authUtils.ts
│       │   │   ⚡ export isUnauthorizedError(error: Error): boolean
│       │   ├── 📄 queryClient.ts
│       │   │   ⚡ async throwIfResNotOk(res: Response): Promise<void>
│       │   │   ⚡ export async apiRequest(method: string, url: string, data?: unknown | undefined): Promise<Response>
│       │   │   ➡️ export getQueryFn({ on401: unauthorizedBehavior }: any): ({ queryKey }: { queryKey: QueryKey; signal: AbortSignal; meta: Record<string, unknown> | undefined; pageParam?: unknown; direction?: unknown; }) => Promise<any>
│       │   └── 📄 utils.ts
│       │       ⚡ export cn(inputs: ClassValue[]): string
│       ├── 📄 main.tsx
│       └── 📁 pages/
│           ├── 📄 Subscription.tsx
│           │   ⚡ export Subscription(): Element
│           │   📋 SubscriptionPlan
│           │   📋 UserSubscription
│           ├── 📄 add-data.tsx
│           │   ⚡ export AddData(): Element
│           │   📋 WebsiteSource
│           │   📋 ChatbotConfig
│           ├── 📄 chat-history.tsx
│           │   ⚡ export ChatHistory(): Element
│           │   📋 ChatSession
│           │   📋 Message
│           │   📋 SessionsResponse
│           │   📋 MessagesResponse
│           ├── 📄 chat-widget.tsx
│           │   ⚡ export ChatWidgetPage(): Element
│           ├── 📄 chatbot-edit.tsx
│           │   ⚡ export ChatbotEdit(): Element
│           ├── 📄 chatbot-embed.tsx
│           │   ⚡ export ChatbotEmbed(): Element
│           │   📋 ChatbotConfig
│           ├── 📄 chatbot-form.tsx
│           │   ⚡ export ChatbotForm(): Element
│           ├── 📄 chatbot-test.tsx
│           │   ⚡ export ChatbotTest(): Element
│           │   📋 ChatbotConfig
│           ├── 📄 dashboard.tsx
│           │   ⚡ export Dashboard(): Element
│           │   📋 ChatbotConfig
│           ├── 📄 docs.tsx
│           │   ⚡ export Docs(): Element
│           ├── 📄 home.tsx
│           │   ⚡ export Home(): Element
│           │   📋 ChatbotConfig
│           ├── 📄 not-found.tsx
│           │   ⚡ export NotFound(): Element
│           ├── 📄 survey-builder.tsx
│           │   ⚡ export SurveyBuilderPage(): Element
│           │   📋 Survey
│           ├── 📄 ui-designer.tsx
│           │   ⚡ export UIDesigner(): Element
│           │   📋 ChatMessage
│           └── 📄 widget-test.tsx
│               ⚡ export WidgetTest(): Element
│               📋 ChatbotConfig
├── 📄 drizzle.config.ts
├── 📄 postcss.config.js
├── 📁 public/
│   └── 📄 embed.js
│       ⚡ autoInitialize(): void
├── 📁 server/
│   ├── 📄 ai-response-schema.ts
│   │   ⚡ export buildSystemPrompt(chatbotConfig?: any, surveyContext?: string): string
│   │   ⚡ export buildSurveyContext(survey: any, surveySession: any): string
│   ├── 📄 db.js
│   ├── 📄 db.ts
│   ├── 📄 email-service.ts
│   │   📋 FormSubmissionData
│   │   🏛️ BrevoEmailService
│   │   │  🏗️ constructor(): void
│   │   │  🔧 generateEmailContent(data: FormSubmissionData): { html: string; text: string }
│   │   │  🔧 async sendFormSubmission(data: FormSubmissionData, recipientEmail: string, recipientName?: string, senderEmail?: string, senderName?: string): Promise<{ success: boolean; messageId?: string; error?: string }>
│   │   │  🔧 async testConnection(): Promise<{ success: boolean; error?: string }>
│   ├── 📄 index.ts
│   ├── 📁 openai/
│   │   ├── 📄 client.ts
│   │   │   ⚡ export getOpenAIClient(): OpenAI
│   │   │   ⚡ export isOpenAIConfigured(): boolean
│   │   ├── 📄 context-builder.ts
│   │   │   ⚡ export async buildWebsiteContext(chatbotConfigId: number, searchQuery: string, maxContentLength: number): Promise<string>
│   │   │   ⚡ export async buildActiveSurveyContext(sessionId: string): Promise<{
  context: string;
  hasMenuRequired: boolean;
  questionIndex: number;
}>
│   │   │   ⚡ export async buildCompleteSystemPrompt(chatbotConfig: any, sessionId: string, searchQuery: string): Promise<{ 
  systemPrompt: string; 
  surveyInfo: { hasMenuRequired: boolean; questionIndex: number } 
}>
│   │   ├── 📄 error-handler.ts
│   │   │   ⚡ export generateFallbackResponse(): AIResponse
│   │   │   ⚡ export attemptResponseSalvage(accumulatedContent: string): AIResponse | null
│   │   │   ⚡ export handleParseError(parseError: unknown, accumulatedContent: string, context: string): AIResponse
│   │   │   ⚡ export handleCriticalError(error: unknown, context: string): AIResponse
│   │   ├── 📄 index.ts
│   │   ├── 📄 response-generator.ts
│   │   │   ⚡ export async generatePromptAssistance(action: string, userMessage: string, chatbotContext: {
    name?: string;
    description?: string;
    currentPrompt?: string;
  }): Promise<AIResponse>
│   │   │   ⚡ export async generateMultiBubbleResponse(userMessage: string, sessionId: string, conversationHistory: ConversationMessage[], chatbotConfig?: any): Promise<AIResponse>
│   │   │   ⚡ export async generateOptionResponse(optionId: string, payload: any, sessionId: string, conversationHistory: ConversationMessage[], chatbotConfig?: any): Promise<AIResponse>
│   │   │   ⚡ export async generateStructuredResponse(userMessage: string, sessionId: string, conversationHistory: ConversationMessage[], chatbotConfig?: any): Promise<AIResponse>
│   │   │   📋 ChatConfig
│   │   │   📋 ConversationMessage
│   │   ├── 📄 response-parser.ts
│   │   │   ⚡ export parseOpenAIResponse(accumulatedContent: string): AIResponse
│   │   │   ⚡ export parseStreamingContent(accumulatedContent: string): {
  success: boolean;
  bubbles?: any[];
  error?: any;
}
│   │   │   ⚡ export isBubbleComplete(bubble: any): boolean
│   │   │   ⚡ export async validateSurveyMenuRequirements(sessionId: string, validated: AIResponse): Promise<void>
│   │   │   ⚡ export detectJsonBoundary(delta: string, accumulatedContent: string): boolean
│   │   ├── 📄 schema.ts
│   │   └── 📄 streaming-handler.ts
│   │       ⚡ export async generateStreamingResponse(userMessage: string, sessionId: string, conversationHistory: ConversationMessage[], chatbotConfig?: any): AsyncGenerator<StreamingBubbleEvent, void, unknown>
│   │       📋 StreamingBubbleEvent
│   ├── 📄 replitAuth.ts
│   │   ⚡ export getSession(): RequestHandler<ParamsDictionary, any, any, ParsedQs, Record<string, any>>
│   │   ⚡ updateUserSession(user: any, tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers): void
│   │   ⚡ async upsertUser(claims: any): Promise<void>
│   │   ⚡ export async setupAuth(app: Express): Promise<void>
│   │   ➡️ export async isAuthenticated(req: any, res: any, next: any): Promise<void | Response<any, Record<string, any>, number>>
│   ├── 📁 routes/
│   │   ├── 📄 auth.ts
│   │   │   ⚡ export async setupAuthRoutes(app: Express): Promise<void>
│   │   ├── 📄 chat.ts
│   │   │   ⚡ export setupChatRoutes(app: Express): void
│   │   │   ⚡ async handleStreamingResponse(userMessage: string, sessionId: string, res: any, chatbotConfigId?: string): Promise<void>
│   │   │   ⚡ getTextualRepresentation(msg: any): string
│   │   │   ⚡ async handleSurveySessionCreation(sessionId: string, messageContent: string, chatbotConfigId?: string, session?: any): Promise<void>
│   │   ├── 📄 chatbots.ts
│   │   │   ⚡ export setupChatbotRoutes(app: Express): void
│   │   ├── 📄 index.ts
│   │   │   ⚡ export async registerRoutes(app: Express): Promise<Server>
│   │   ├── 📄 public.ts
│   │   │   ⚡ findStaticFilePath(filename: string): string | null
│   │   │   ⚡ export setupPublicRoutes(app: Express): void
│   │   ├── 📄 subscription.ts
│   │   │   ➡️ initializeStripe(): Stripe
│   │   │   ⚡ async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void>
│   │   │   ⚡ async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void>
│   │   │   ⚡ async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void>
│   │   │   ⚡ async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void>
│   │   │   ⚡ async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void>
│   │   ├── 📄 surveys.ts
│   │   │   ⚡ export setupSurveyRoutes(app: Express): void
│   │   ├── 📄 ui-designer.ts
│   │   │   ⚡ export setupUIDesignerRoutes(app: Express): void
│   │   ├── 📄 uploads.ts
│   │   │   ⚡ export setupUploadRoutes(app: Express): void
│   │   └── 📄 websites.ts
│   │       ⚡ export setupWebsiteRoutes(app: Express): void
│   ├── 📄 routes.ts
│   │   ⚡ export async registerRoutes(app: Express): Promise<Server>
│   ├── 📄 seed-plans.js
│   │   ⚡ seedSubscriptionPlans(): any
│   ├── 📄 seed-plans.ts
│   │   ⚡ async seedSubscriptionPlans(): Promise<void>
│   ├── 📄 storage.ts
│   │   📋 IStorage
│   │   │  🔧 getUser(id: string): Promise<User | undefined>
│   │   │  🔧 upsertUser(user: UpsertUser): Promise<User>
│   │   │  🔧 getChatSession(sessionId: string): Promise<ChatSession | undefined>
│   │   │  🔧 getChatSessionsByChatbotGuid(chatbotGuid: string): Promise<ChatSession[]>
│   │   │  🔧 createChatSession(session: InsertChatSession): Promise<ChatSession>
│   │   │  🔧 updateChatSession(sessionId: string, data: Partial<ChatSession>): Promise<ChatSession | undefined>
│   │   │  🔧 getMessages(sessionId: string): Promise<Message[]>
│   │   │  🔧 createMessage(message: InsertMessage): Promise<Message>
│   │   │  🔧 getRecentMessages(sessionId: string, limit?: number): Promise<Message[]>
│   │   │  🔧 getChatbotConfigs(userId: string): Promise<ChatbotConfig[]>
│   │   │  🔧 getChatbotConfig(id: number): Promise<ChatbotConfig | undefined>
│   │   │  🔧 getChatbotConfigByGuid(userId: string, guid: string): Promise<ChatbotConfig | null>
│   │   │  🔧 createChatbotConfig(config: InsertChatbotConfig): Promise<ChatbotConfig>
│   │   │  🔧 updateChatbotConfig(id: number, data: Partial<ChatbotConfig>): Promise<ChatbotConfig | undefined>
│   │   │  🔧 deleteChatbotConfig(id: number): Promise<void>
│   │   │  🔧 getWebsiteSources(chatbotConfigId: number): Promise<WebsiteSource[]>
│   │   │  🔧 getWebsiteSource(id: number): Promise<WebsiteSource | undefined>
│   │   │  🔧 createWebsiteSource(source: InsertWebsiteSource): Promise<WebsiteSource>
│   │   │  🔧 updateWebsiteSource(id: number, data: Partial<WebsiteSource>): Promise<WebsiteSource | undefined>
│   │   │  🔧 deleteWebsiteSource(id: number): Promise<void>
│   │   │  🔧 getWebsiteContents(websiteSourceId: number): Promise<WebsiteContent[]>
│   │   │  🔧 createWebsiteContent(content: InsertWebsiteContent, embeddingArray: number[]): Promise<WebsiteContent>
│   │   │  🔧 searchSimilarContent(chatbotConfigId: number, query: string, limit?: number): Promise<WebsiteContent[]>
│   │   │  🔧 getSurveys(chatbotConfigId: number): Promise<Survey[]>
│   │   │  🔧 getSurvey(id: number): Promise<Survey | undefined>
│   │   │  🔧 createSurvey(surveyData: InsertSurvey): Promise<Survey>
│   │   │  🔧 updateSurvey(id: number, data: Partial<Survey>): Promise<Survey | undefined>
│   │   │  🔧 deleteSurvey(id: number): Promise<void>
│   │   │  🔧 getSurveySession(surveyId: number, sessionId: string): Promise<SurveySession | undefined>
│   │   │  🔧 createSurveySession(sessionData: InsertSurveySession): Promise<SurveySession>
│   │   │  🔧 updateSurveySession(id: number, data: Partial<SurveySession>): Promise<SurveySession | undefined>
│   │   │  🔧 getSurveySessionBySessionId(sessionId: string): Promise<SurveySession | undefined>
│   │   │  🔧 setActiveSurvey(sessionId: string, surveyId: number | null): Promise<ChatSession | undefined>
│   │   │  🔧 getActiveSurveySession(sessionId: string): Promise<SurveySession | undefined>
│   │   │  🔧 deactivateAllSurveySessions(sessionId: string): Promise<void>
│   │   │  🔧 getConversationCount(userId: string): Promise<number>
│   │   │  🔧 getSubscriptionPlans(): Promise<SubscriptionPlan[]>
│   │   │  🔧 getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>
│   │   │  🔧 createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>
│   │   │  🔧 updateSubscriptionPlan(id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined>
│   │   │  🔧 getUserSubscription(userId: string): Promise<Subscription | undefined>
│   │   │  🔧 getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined>
│   │   │  🔧 createSubscription(subscription: InsertSubscription): Promise<Subscription>
│   │   │  🔧 updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription | undefined>
│   │   │  🔧 updateSubscriptionByStripeId(stripeSubscriptionId: string, data: Partial<Subscription>): Promise<Subscription | undefined>
│   │   │  🔧 getUserSubscriptionWithPlan(userId: string): Promise<(Subscription & { plan: SubscriptionPlan }) | undefined>
│   │   │  🔧 incrementMessageUsage(userId: string): Promise<void>
│   │   │  🔧 resetMonthlyMessageUsage(userId: string): Promise<void>
│   │   │  🔧 checkBotLimit(userId: string): Promise<boolean>
│   │   │  🔧 checkMessageLimit(userId: string): Promise<boolean>
│   │   │  🔧 getOrCreateFreeSubscription(userId: string): Promise<Subscription & { plan: SubscriptionPlan }>
│   │   🏛️ DatabaseStorage
│   │   │  🔧 async getUser(id: string): Promise<User | undefined>
│   │   │  🔧 async upsertUser(userData: UpsertUser): Promise<User>
│   │   │  🔧 async getChatSession(sessionId: string): Promise<ChatSession | undefined>
│   │   │  🔧 async getChatSessionsByChatbotGuid(chatbotGuid: string): Promise<ChatSession[]>
│   │   │  🔧 async createChatSession(sessionData: InsertChatSession): Promise<ChatSession>
│   │   │  🔧 async updateChatSession(sessionId: string, data: Partial<ChatSession>): Promise<ChatSession | undefined>
│   │   │  🔧 async getMessages(sessionId: string): Promise<Message[]>
│   │   │  🔧 async createMessage(messageData: InsertMessage): Promise<Message>
│   │   │  🔧 async getRecentMessages(sessionId: string, limit: number): Promise<Message[]>
│   │   │  🔧 async getChatbotConfigs(userId: string): Promise<ChatbotConfig[]>
│   │   │  🔧 async getChatbotConfig(id: number): Promise<ChatbotConfig | undefined>
│   │   │  🔧 async getChatbotConfigByGuidPublic(guid: string): Promise<ChatbotConfig | null>
│   │   │  🔧 async getChatbotConfigByGuid(userId: string, guid: string): Promise<ChatbotConfig | null>
│   │   │  🔧 async getPublicChatbotConfigByGuid(guid: string): Promise<ChatbotConfig | null>
│   │   │  🔧 async createChatbotConfig(configData: InsertChatbotConfig): Promise<ChatbotConfig>
│   │   │  🔧 async updateChatbotConfig(id: number, data: Partial<ChatbotConfig>): Promise<ChatbotConfig | undefined>
│   │   │  🔧 async deleteChatbotConfig(id: number): Promise<void>
│   │   │  🔧 async getWebsiteSources(chatbotConfigId: number): Promise<WebsiteSource[]>
│   │   │  🔧 async getWebsiteSource(id: number): Promise<WebsiteSource | undefined>
│   │   │  🔧 async createWebsiteSource(sourceData: InsertWebsiteSource): Promise<WebsiteSource>
│   │   │  🔧 async updateWebsiteSource(id: number, data: Partial<WebsiteSource>): Promise<WebsiteSource | undefined>
│   │   │  🔧 async deleteWebsiteSource(id: number): Promise<void>
│   │   │  🔧 async getWebsiteContents(websiteSourceId: number): Promise<WebsiteContent[]>
│   │   │  🔧 async createWebsiteContent(contentData: InsertWebsiteContent, embeddingArray: number[]): Promise<WebsiteContent>
│   │   │  🔧 async searchSimilarContent(chatbotConfigId: number, query: string, limit: number): Promise<WebsiteContent[]>
│   │   │  🔧 async getSurveys(chatbotConfigId: number): Promise<Survey[]>
│   │   │  🔧 async getSurvey(id: number): Promise<Survey | undefined>
│   │   │  🔧 async createSurvey(surveyData: InsertSurvey): Promise<Survey>
│   │   │  🔧 async updateSurvey(id: number, data: Partial<Survey>): Promise<Survey | undefined>
│   │   │  🔧 async deleteSurvey(id: number): Promise<void>
│   │   │  🔧 async getSurveySession(surveyId: number, sessionId: string): Promise<SurveySession | undefined>
│   │   │  🔧 async createSurveySession(sessionData: InsertSurveySession): Promise<SurveySession>
│   │   │  🔧 async updateSurveySession(id: number, data: Partial<SurveySession>): Promise<SurveySession | undefined>
│   │   │  🔧 async getSurveySessionBySessionId(sessionId: string): Promise<SurveySession | undefined>
│   │   │  🔧 async setActiveSurvey(sessionId: string, surveyId: number | null): Promise<ChatSession | undefined>
│   │   │  🔧 async getActiveSurveySession(sessionId: string): Promise<SurveySession | undefined>
│   │   │  🔧 async deactivateAllSurveySessions(sessionId: string): Promise<void>
│   │   │  🔧 async getConversationCount(userId: string): Promise<number>
│   │   │  🔧 async getSubscriptionPlans(): Promise<SubscriptionPlan[]>
│   │   │  🔧 async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>
│   │   │  🔧 async createSubscriptionPlan(planData: InsertSubscriptionPlan): Promise<SubscriptionPlan>
│   │   │  🔧 async updateSubscriptionPlan(id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined>
│   │   │  🔧 async getUserSubscription(userId: string): Promise<Subscription | undefined>
│   │   │  🔧 async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined>
│   │   │  🔧 async createSubscription(subscriptionData: InsertSubscription): Promise<Subscription>
│   │   │  🔧 async updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription | undefined>
│   │   │  🔧 async updateSubscriptionByStripeId(stripeSubscriptionId: string, data: Partial<Subscription>): Promise<Subscription | undefined>
│   │   │  🔧 async getUserSubscriptionWithPlan(userId: string): Promise<(Subscription & { plan: SubscriptionPlan }) | undefined>
│   │   │  🔧 async incrementMessageUsage(userId: string): Promise<void>
│   │   │  🔧 async resetMonthlyMessageUsage(userId: string): Promise<void>
│   │   │  🔧 async getOrCreateFreeSubscription(userId: string): Promise<Subscription & { plan: SubscriptionPlan }>
│   │   │  🔧 async checkBotLimit(userId: string): Promise<boolean>
│   │   │  🔧 async checkMessageLimit(userId: string): Promise<boolean>
│   │   🏛️ ChatService
│   │   │  🏗️ constructor(): void
│   │   │  🔧 async getMessages(sessionId: string): Promise<any[]>
│   │   │  🔧 async sendMessage(sessionId: string, message: string): Promise<any>
│   ├── 📄 ui-designer-service.ts
│   │   ⚡ createSystemPrompt(availableSurveys: any[]): string
│   │   ⚡ export async generateHomeScreenConfig(userPrompt: string, chatbotId?: number): Promise<HomeScreenConfig>
│   │   ⚡ export async modifyHomeScreenConfig(currentConfig: HomeScreenConfig, modificationPrompt: string, chatbotId?: number): Promise<HomeScreenConfig>
│   │   ⚡ export getDefaultHomeScreenConfig(): HomeScreenConfig
│   ├── 📄 upload-service.ts
│   │   ⚡ async ensureClientInitialized(): Promise<boolean>
│   │   ⚡ export async uploadBackgroundImage(file: Express.Multer.File, userId: string): Promise<UploadResult>
│   │   ⚡ export async uploadAvatar(file: Express.Multer.File, userId: string): Promise<UploadResult>
│   │   ⚡ export async getFileFromStorage(fileName: string): Promise<{ success: boolean; data?: Buffer; error?: string; contentType?: string }>
│   │   ⚡ export async deleteFile(fileName: string): Promise<boolean>
│   │   📋 UploadResult
│   ├── 📄 vite.ts
│   │   ⚡ export log(message: string, source: any): void
│   │   ⚡ export async setupVite(app: Express, server: Server): Promise<void>
│   │   ⚡ export serveStatic(app: Express): void
│   └── 📄 website-scanner.ts
│       ⚡ initializeOpenAI(): OpenAI
│       📋 ScanResult
│       🏛️ WebsiteScanner
│       │  🔧 async scanWebsite(websiteSourceId: number): Promise<ScanResult>
│       │  🔧 async discoverUrls(websiteSource: WebsiteSource): Promise<string[]>
│       │  🔧 async findSitemap(baseUrl: string): Promise<string[]>
│       │  🔧 async parseSitemap(sitemapUrl: string): Promise<string[]>
│       │  🔧 async crawlPageLinks(url: string, baseOrigin: string): Promise<string[]>
│       │  🔧 async extractContentSimple(url: string): Promise<{ title: string; content: string } | null>
│       │  🔧 async processAndStore(websiteSourceId: number, url: string, content: { title: string; content: string }): Promise<void>
│       │  🔧 splitIntoChunks(text: string, maxLength: number): string[]
│       │  🔧 hasNoIndexDirective(robotsContent: string): boolean
│       │  🔧 isImageSitemap(sitemapUrl: string): boolean
│       │  🔧 isValidWebPageUrl(url: string): boolean
│       │  🔧 async generateEmbedding(text: string): Promise<number[]>
│       │  🔧 async processTextContent(websiteSourceId: number, title: string, textContent: string): Promise<void>
├── 📁 shared/
│   └── 📄 schema.ts
├── 📄 tailwind.config.ts
└── 📄 vite.config.ts
