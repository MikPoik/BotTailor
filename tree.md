# Source Code Tree

Generated on: 2026-01-08T19:41:07.825Z


```
├── 📁 client/
│   └── 📁 src/
│       ├── 📄 App.tsx
│       │   ⚡ HandlerRoutes(): Element
│       │   ⚡ AuthenticatedRouter(): Element
│       │   ⚡ AuthenticatedRouterContent(): Element
│       │   ⚡ Router(): Element
│       │   ⚡ App(): Element
│       ├── 📁 components/
│       │   ├── 📁 chat/
│       │   │   ├── 📄 about-view.tsx
│       │   │   │   ⚡ export AboutView({ 
  onClose, 
  primaryColor = '#2563eb',
  backgroundColor = '#ffffff',
  textColor = '#1f2937'
}: AboutViewProps): Element
│       │   │   │   📋 AboutViewProps
│       │   │   ├── 📄 chat-interface.tsx
│       │   │   │   ⚡ export ChatInterface({ sessionId, isMobile, isPreloaded = false, chatbotConfig }: ChatInterfaceProps): Element
│       │   │   │   📋 ChatInterfaceProps
│       │   │   ├── 📄 chat-widget.tsx
│       │   │   │   ➡️ widgetDebug(): boolean
│       │   │   │   ➡️ debugLog(args: any[]): void
│       │   │   │   ⚡ ChatWidget({ 
  sessionId: providedSessionId, 
  position = 'bottom-right',
  primaryColor = '#2563eb',
  backgroundColor = '#ffffff',
  textColor = '#1f2937',
  chatbotConfig
}: ChatWidgetProps): string | number | boolean | Element | Iterable<ReactNode> | null | undefined
│       │   │   │   📋 ChatWidgetProps
│       │   │   ├── 📄 color-utils.ts
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
│       │   │   │   ⚡ resolveColors(chatbotConfig?: any): { messageBubbleBg: string; primaryColor: any; backgroundColor: any; textColor: any; botBubbleMode: any; }
│       │   │   │   📋 MessageBubbleProps
│       │   │   ├── 📁 message-types/
│       │   │   │   ├── 📄 card-message.tsx
│       │   │   │   │   📋 CardMessageProps
│       │   │   │   ├── 📄 form-message.tsx
│       │   │   │   │   📋 FormMessageProps
│       │   │   │   ├── 📄 menu-message.tsx
│       │   │   │   │   📋 MenuMessageProps
│       │   │   │   ├── 📄 multiselect-message.tsx
│       │   │   │   │   📋 MultiselectMessageProps
│       │   │   │   └── 📄 rating-message.tsx
│       │   │   │       📋 RatingMessageProps
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
│       │   │   │   ➡️ isOtherOption(option: any): boolean
│       │   │   │   📋 RichMessageProps
│       │   │   ├── 📄 streaming-message.tsx
│       │   │   │   📋 StreamingMessageProps
│       │   │   ├── 📄 survey-assistant-chatbox.tsx
│       │   │   │   ⚡ export SurveyAssistantChatbox({ 
  currentSurvey, 
  onSurveyGenerated, 
  chatbotConfig,
  chatbotGuid 
}: SurveyAssistantChatboxProps): Element
│       │   │   │   📋 SurveyAssistantMessage
│       │   │   │   📋 Survey
│       │   │   │   📋 SurveyAssistantChatboxProps
│       │   │   ├── 📄 tabbed-chat-interface.tsx
│       │   │   │   ➡️ tabDebug(): boolean
│       │   │   │   ➡️ debugLog(args: any[]): void
│       │   │   │   ⚡ export TabbedChatInterface({
  sessionId,
  isMobile,
  isPreloaded = false,
  onClose,
  isEmbedded = false,
  chatbotConfigId,
  chatbotConfig,
  onSessionInitialize,
  forceInitialize = false
}: TabbedChatInterfaceProps): Element
│       │   │   │   📋 TabbedChatInterfaceProps
│       │   │   └── 📄 typing-indicator.tsx
│       │   │       ⚡ export TypingIndicator({ chatbotConfig }: TypingIndicatorProps): Element
│       │   │       📋 TypingIndicatorProps
│       │   ├── 📄 client-only.tsx
│       │   │   ⚡ export ClientOnly({ children, fallback = null }: ClientOnlyProps): Element
│       │   │   📋 ClientOnlyProps
│       │   ├── 📄 cookie-consent-modal.tsx
│       │   │   ➡️ export CookieConsentModal({ onConsent }: any): Element | null
│       │   │   📋 CookieConsentModalProps
│       │   ├── 📄 footer.tsx
│       │   │   ⚡ export Footer(): Element
│       │   ├── 📄 navbar.tsx
│       │   │   ⚡ export Navbar(): Element
│       │   ├── 📄 theme-toggle.tsx
│       │   │   ⚡ export ThemeToggle(): Element
│       │   ├── 📁 ui/
│       │   │   ├── 📄 accordion.tsx
│       │   │   ├── 📄 alert-dialog.tsx
│       │   │   │   ➡️ AlertDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): Element
│       │   │   │   ➡️ AlertDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): Element
│       │   │   ├── 📄 alert.tsx
│       │   │   ├── 📄 aspect-ratio.tsx
│       │   │   ├── 📄 avatar-upload.tsx
│       │   │   │   ⚡ export AvatarUpload({ value, onValueChange, disabled }: AvatarUploadProps): Element
│       │   │   │   📋 AvatarUploadProps
│       │   │   ├── 📄 avatar.tsx
│       │   │   ├── 📄 background-image-upload.tsx
│       │   │   │   ⚡ export BackgroundImageUpload({ value, onValueChange, disabled }: BackgroundImageUploadProps): Element
│       │   │   │   📋 BackgroundImageUploadProps
│       │   │   ├── 📄 badge.tsx
│       │   │   │   ⚡ Badge({ className, variant, ...props }: BadgeProps): Element
│       │   │   │   📋 BadgeProps
│       │   │   ├── 📄 breadcrumb.tsx
│       │   │   │   ➡️ BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">): Element
│       │   │   │   ➡️ BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">): Element
│       │   │   ├── 📄 button.tsx
│       │   │   │   📋 ButtonProps
│       │   │   ├── 📄 calendar.tsx
│       │   │   │   ⚡ Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps): Element
│       │   │   ├── 📄 card.tsx
│       │   │   ├── 📄 carousel.tsx
│       │   │   │   ⚡ useCarousel(): CarouselContextProps
│       │   │   ├── 📄 chart.tsx
│       │   │   │   ⚡ useChart(): ChartContextProps
│       │   │   │   ➡️ ChartStyle({ id, config }: { id: string; config: ChartConfig }): Element | null
│       │   │   │   ⚡ getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string): ({ label?: ReactNode; icon?: ComponentType<{}> | undefined; } & ({ color?: string | undefined; theme?: undefined; } | { color?: undefined; theme: Record<"light" | "dark", string>; })) | undefined
│       │   │   ├── 📄 checkbox.tsx
│       │   │   ├── 📄 collapsible.tsx
│       │   │   ├── 📄 command.tsx
│       │   │   │   ➡️ CommandDialog({ children, ...props }: DialogProps): Element
│       │   │   │   ➡️ CommandShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>): Element
│       │   │   ├── 📄 context-menu.tsx
│       │   │   │   ➡️ ContextMenuShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>): Element
│       │   │   ├── 📄 dialog.tsx
│       │   │   │   ➡️ DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): Element
│       │   │   │   ➡️ DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): Element
│       │   │   ├── 📄 drawer.tsx
│       │   │   │   ➡️ Drawer({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>): Element
│       │   │   │   ➡️ DrawerHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): Element
│       │   │   │   ➡️ DrawerFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): Element
│       │   │   ├── 📄 dropdown-menu.tsx
│       │   │   │   ➡️ DropdownMenuShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>): Element
│       │   │   ├── 📄 form.tsx
│       │   │   │   ➡️ FormField({
  ...props
}: ControllerProps<TFieldValues, TName>): Element
│       │   │   │   ➡️ useFormField(): { invalid: boolean; isDirty: boolean; isTouched: boolean; isValidating: boolean; error?: FieldError | undefined; id: string; name: string; formItemId: string; formDescriptionId: string; formMessageId: string; }
│       │   │   ├── 📄 hover-card.tsx
│       │   │   ├── 📄 input-otp.tsx
│       │   │   ├── 📄 input.tsx
│       │   │   ├── 📄 label.tsx
│       │   │   ├── 📄 menubar.tsx
│       │   │   │   ⚡ MenubarMenu({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>): Element
│       │   │   │   ⚡ MenubarGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Group>): Element
│       │   │   │   ⚡ MenubarPortal({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Portal>): Element
│       │   │   │   ⚡ MenubarRadioGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>): Element
│       │   │   │   ⚡ MenubarSub({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Sub>): Element
│       │   │   │   ➡️ MenubarShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>): Element
│       │   │   ├── 📄 navigation-menu.tsx
│       │   │   ├── 📄 pagination.tsx
│       │   │   │   ➡️ Pagination({ className, ...props }: React.ComponentProps<"nav">): Element
│       │   │   │   ➡️ PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps): Element
│       │   │   │   ➡️ PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>): Element
│       │   │   │   ➡️ PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>): Element
│       │   │   │   ➡️ PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">): Element
│       │   │   ├── 📄 popover.tsx
│       │   │   ├── 📄 progress.tsx
│       │   │   ├── 📄 radio-group.tsx
│       │   │   ├── 📄 resizable.tsx
│       │   │   │   ➡️ ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>): Element
│       │   │   │   ➡️ ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}): Element
│       │   │   ├── 📄 scroll-area.tsx
│       │   │   ├── 📄 select.tsx
│       │   │   ├── 📄 separator.tsx
│       │   │   ├── 📄 sheet.tsx
│       │   │   │   ➡️ SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): Element
│       │   │   │   ➡️ SheetFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): Element
│       │   │   │   📋 SheetContentProps
│       │   │   ├── 📄 sidebar.tsx
│       │   │   │   ⚡ useSidebar(): SidebarContextProps
│       │   │   ├── 📄 skeleton.tsx
│       │   │   │   ⚡ Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): Element
│       │   │   ├── 📄 slider.tsx
│       │   │   ├── 📄 switch.tsx
│       │   │   ├── 📄 table.tsx
│       │   │   ├── 📄 tabs.tsx
│       │   │   ├── 📄 textarea.tsx
│       │   │   ├── 📄 toast.tsx
│       │   │   ├── 📄 toaster.tsx
│       │   │   │   ⚡ export Toaster(): Element
│       │   │   ├── 📄 toggle-group.tsx
│       │   │   ├── 📄 toggle.tsx
│       │   │   └── 📄 tooltip.tsx
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
    backgroundImageUrl?: string;
    titleFontSize?: string;
    descriptionFontSize?: string;
  }): Element | null
│       │       │   📋 ComponentRegistryProps
│       │       └── 📄 dynamic-home-screen.tsx
│       │           ⚡ resolveColors(config: HomeScreenConfig, previewFontSizes?: { titleFontSize?: string; descriptionFontSize?: string }): { primaryColor: any; backgroundColor: any; textColor: any; backgroundImageUrl: any; backgroundImageTransparency: any; titleFontSize: string; descriptionFontSize: string; }
│       │           ⚡ export DynamicHomeScreen({
  config,
  onTopicClick,
  onActionClick,
  className,
  previewFontSizes
}: DynamicHomeScreenProps): Element
│       │           📋 DynamicHomeScreenProps
│       ├── 📁 contexts/
│       │   └── 📄 theme-context.tsx
│       │       ⚡ export ThemeProvider({ children }: { children: React.ReactNode }): Element
│       │       ⚡ export useTheme(): ThemeContextType
│       │       📋 ThemeContextType
│       ├── 📄 entry-server.tsx
│       │   ⚡ export render(url: string, search?: string): { stream: PipeableStream; ssrContext: SSRContext; }
│       │   ⚡ export generateHTML(url: string, search?: string): Promise<{ html: string; ssrContext: SSRContext }>
│       │   ⚡ escapeHtml(value?: string): string
│       │   ⚡ export generateMetaTags(url: string): string
│       │   📋 SSRContext
│       ├── 📁 hooks/
│       │   ├── 📄 use-chat.ts
│       │   │   ➡️ chatDebug(): boolean
│       │   │   ➡️ logDebug(args: any[]): void
│       │   │   ⚡ export useChat(sessionId: string, chatbotConfigId?: number): { messages: Message[]; sendMessage: (content: string) => Promise<any>; sendStreamingMessage: (userDisplayText: string, onBubbleReceived?: ((message: Message) => void) | undefined, onAllComplete?: ((messages: Message[]) => void) | undefined, onError?: ((error: string) => void) | undefined, internalMessage?: string | ...
│       │   ├── 📄 use-global-chat-session.ts
│       │   │   ⚡ export useGlobalChatSession(): { sessionId: string; }
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
│       │       ⚡ export useAuth(): { user: any; isLoading: boolean; isAuthenticated: boolean; error: Error | null; }
│       ├── 📁 lib/
│       │   ├── 📄 authUtils.ts
│       │   │   ⚡ export isUnauthorizedError(error: Error): boolean
│       │   ├── 📄 client-metadata.ts
│       │   │   ⚡ export updateClientMetadata(pathname: string): void
│       │   │   ⚡ export useClientMetadata(pathname: string): void
│       │   ├── 📄 markdown-utils.ts
│       │   │   ⚡ export parseMarkdown(text: string): string
│       │   ├── 📄 queryClient.ts
│       │   ├── 📄 stack.ts
│       │   └── 📄 utils.ts
│       │       ⚡ export cn(inputs: ClassValue[]): string
│       ├── 📄 main.tsx
│       │   ➡️ AppWithProviders(): Element
│       ├── 📁 pages/
│       │   ├── 📄 Subscription.tsx
│       │   │   ⚡ export Subscription(): Element
│       │   │   📋 SubscriptionPlan
│       │   │   📋 UserSubscription
│       │   ├── 📄 add-data.tsx
│       │   │   ⚡ export AddData(): Element
│       │   │   📋 WebsiteSource
│       │   │   📋 ChatbotConfig
│       │   ├── 📄 chat-history.tsx
│       │   │   ⚡ export ChatHistory(): Element
│       │   │   📋 ChatSession
│       │   │   📋 SessionsResponse
│       │   │   📋 MessagesResponse
│       │   ├── 📄 chat-widget.tsx
│       │   │   ⚡ export ChatWidgetPage(): Element
│       │   ├── 📄 chatbot-edit.tsx
│       │   │   ⚡ export ChatbotEdit(): Element
│       │   ├── 📄 chatbot-embed.tsx
│       │   │   ⚡ export ChatbotEmbed(): Element
│       │   │   📋 ChatbotConfig
│       │   ├── 📄 chatbot-form.tsx
│       │   │   ⚡ export ChatbotForm(): Element
│       │   ├── 📄 chatbot-test.tsx
│       │   │   ⚡ export ChatbotTest(): Element
│       │   │   📋 ChatbotConfig
│       │   ├── 📄 contact.tsx
│       │   │   ⚡ export Contact(): Element
│       │   ├── 📄 dashboard.tsx
│       │   │   ⚡ export Dashboard(): Element
│       │   │   📋 ChatbotConfig
│       │   ├── 📄 docs.tsx
│       │   │   ⚡ export Docs(): Element
│       │   ├── 📄 home.tsx
│       │   │   ⚡ export Home(): Element
│       │   │   📋 ChatbotConfig
│       │   ├── 📄 not-found.tsx
│       │   │   ⚡ export NotFound(): Element
│       │   ├── 📄 pricing.tsx
│       │   │   ⚡ export Pricing(): Element
│       │   │   📋 SubscriptionPlan
│       │   ├── 📄 privacy.tsx
│       │   │   ⚡ export Privacy(): Element
│       │   ├── 📄 survey-analytics.tsx
│       │   │   ⚡ export SurveyAnalytics(): Element
│       │   │   📋 SurveySession
│       │   │   📋 QuestionAnalytics
│       │   │   📋 SurveyBreakdown
│       │   │   📋 SurveyAnalyticsResponse
│       │   │   📋 ChatbotConfig
│       │   ├── 📄 survey-builder.tsx
│       │   │   ➡️ getSurveyConfig(survey: Survey | null): SurveyConfig
│       │   │   ⚡ export SurveyBuilderPage(): Element
│       │   ├── 📄 terms.tsx
│       │   │   ⚡ export Terms(): Element
│       │   └── 📄 ui-designer.tsx
│       │       ➡️ getDefaultConfig(): HomeScreenConfig
│       │       ⚡ export UIDesigner(): Element
│       │       📋 ChatMessage
│       ├── 📁 routes/
│       │   └── 📄 registry.ts
│       │       ⚡ getDefaultMetadata(): RouteMetadata
│       │       ⚡ export getRouteDefinition(path: string): RouteDefinition | undefined
│       │       ⚡ export getRouteMetadata(path: string): RouteMetadata
│       │       ⚡ export shouldSSR(path: string): boolean
│       │       ⚡ export listRegisteredRoutes(): RouteDefinition[]
│       └── 📁 types/
│           └── 📄 message-metadata.ts
│               ➡️ export isStreamingMetadata(metadata: any): metadata is StreamingMetadata
│               ➡️ export isCardMetadata(metadata: any): metadata is CardMetadata
│               ➡️ export isMenuMetadata(metadata: any): metadata is MenuMetadata
│               ➡️ export isFormMetadata(metadata: any): metadata is FormMetadata
│               📋 StreamingMetadata
│               📋 MessageChunk
│               📋 FollowUpMetadata
│               📋 CardMetadata
│               📋 MenuMetadata
│               📋 MultiselectMenuMetadata
│               📋 RatingMetadata
│               📋 QuickRepliesMetadata
│               📋 FormMetadata
│               📋 ImageMetadata
├── 📁 server/
│   ├── 📄 ai-response-schema.ts
│   │   ⚡ export buildSystemPrompt(chatbotConfig?: any, surveyContext?: string, isSurveyActive: any): string
│   │   ⚡ export buildSurveyContext(survey: any, surveySession: any, chatbotConfig?: any): string
│   │   ⚡ getQuestionTypeInstructions(question: any): string
│   │   ⚡ getMenuTypeForQuestion(question: any): string
│   │   ⚡ generateMenuExample(question: any, optionsForExample: string): string
│   │   ⚡ generateRatingExample(question: any): string
│   ├── 📄 db.ts
│   ├── 📄 email-service.ts
│   │   📋 FormSubmissionData
│   │   🏛️ BrevoEmailService
│   │   │  🏗️ constructor(): void
│   │   │  🔧 generateEmailContent(data: FormSubmissionData): { html: string; text: string }
│   │   │  🔧 async sendFormSubmission(data: FormSubmissionData, recipientEmail: string, recipientName?: string, senderEmail?: string, senderName?: string): Promise<{ success: boolean; messageId?: string; error?: string }>
│   │   │  🔧 async testConnection(): Promise<{ success: boolean; error?: string }>
│   ├── 📄 index.ts
│   ├── 📄 neonAuth.ts
│   ├── 📁 openai/
│   │   ├── 📄 client.ts
│   │   ├── 📄 context-builder.ts
│   │   ├── 📄 dynamic-content-validator.ts
│   │   ├── 📄 error-handler.ts
│   │   ├── 📄 index.ts
│   │   ├── 📄 response-generator.ts
│   │   ├── 📄 response-parser.ts
│   │   ├── 📄 schema.ts
│   │   ├── 📄 streaming-handler.ts
│   │   └── 📄 survey-menu-validator.ts
│   ├── 📁 routes/
│   │   ├── 📄 auth.ts
│   │   ├── 📄 chat.ts
│   │   ├── 📄 chatbots.ts
│   │   ├── 📄 contact.ts
│   │   ├── 📄 index.ts
│   │   ├── 📄 public.ts
│   │   ├── 📄 subscription.ts
│   │   ├── 📄 surveys.ts
│   │   ├── 📄 ui-designer.ts
│   │   ├── 📄 uploads.ts
│   │   └── 📄 websites.ts
│   ├── 📄 routes.ts
│   ├── 📄 seed-plans.ts
│   │   ⚡ async seedSubscriptionPlans(): Promise<void>
│   ├── 📄 storage.ts
│   ├── 📄 ui-designer-service.ts
│   ├── 📄 upload-service.ts
│   ├── 📄 vite.ts
│   └── 📄 website-scanner.ts
└── 📁 shared/
    ├── 📄 route-metadata.ts
    │   ⚡ export normalizeRoutePath(path: string): string
    │   📋 RouteMetadata
    │   📋 RouteDefinition
    └── 📄 schema.ts

```
