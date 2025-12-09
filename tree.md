# Directory Tree

Generated on: 2025-12-09T08:06:56.854Z

*Simple mode: Directory structure only*

```
├── 📁 client/
│   └── 📁 src/
│       ├── 📄 App.tsx
│       ├── 📁 components/
│       │   ├── 📁 chat/
│       │   │   ├── 📄 chat-interface.tsx
│       │   │   ├── 📄 chat-widget.tsx
│       │   │   ├── 📄 home-tab.tsx
│       │   │   ├── 📄 message-bubble.tsx
│       │   │   ├── 📁 message-types/
│       │   │   │   ├── 📄 card-message.tsx
│       │   │   │   ├── 📄 form-message.tsx
│       │   │   │   ├── 📄 menu-message.tsx
│       │   │   │   ├── 📄 multiselect-message.tsx
│       │   │   │   └── 📄 rating-message.tsx
│       │   │   ├── 📄 prompt-assistant-chatbox.tsx
│       │   │   ├── 📄 rich-message.tsx
│       │   │   ├── 📄 streaming-message.tsx
│       │   │   ├── 📄 survey-assistant-chatbox.tsx
│       │   │   ├── 📄 tabbed-chat-interface.tsx
│       │   │   └── 📄 typing-indicator.tsx
│       │   ├── 📄 client-only.tsx
│       │   ├── 📄 footer.tsx
│       │   ├── 📄 navbar.tsx
│       │   ├── 📄 theme-toggle.tsx
│       │   ├── 📁 ui/
│       │   │   ├── 📄 accordion.tsx
│       │   │   ├── 📄 alert-dialog.tsx
│       │   │   ├── 📄 alert.tsx
│       │   │   ├── 📄 aspect-ratio.tsx
│       │   │   ├── 📄 avatar-upload.tsx
│       │   │   ├── 📄 avatar.tsx
│       │   │   ├── 📄 background-image-upload.tsx
│       │   │   ├── 📄 badge.tsx
│       │   │   ├── 📄 breadcrumb.tsx
│       │   │   ├── 📄 button.tsx
│       │   │   ├── 📄 calendar.tsx
│       │   │   ├── 📄 card.tsx
│       │   │   ├── 📄 carousel.tsx
│       │   │   ├── 📄 chart.tsx
│       │   │   ├── 📄 checkbox.tsx
│       │   │   ├── 📄 collapsible.tsx
│       │   │   ├── 📄 command.tsx
│       │   │   ├── 📄 context-menu.tsx
│       │   │   ├── 📄 dialog.tsx
│       │   │   ├── 📄 drawer.tsx
│       │   │   ├── 📄 dropdown-menu.tsx
│       │   │   ├── 📄 form.tsx
│       │   │   ├── 📄 hover-card.tsx
│       │   │   ├── 📄 input-otp.tsx
│       │   │   ├── 📄 input.tsx
│       │   │   ├── 📄 label.tsx
│       │   │   ├── 📄 menubar.tsx
│       │   │   ├── 📄 navigation-menu.tsx
│       │   │   ├── 📄 pagination.tsx
│       │   │   ├── 📄 popover.tsx
│       │   │   ├── 📄 progress.tsx
│       │   │   ├── 📄 radio-group.tsx
│       │   │   ├── 📄 resizable.tsx
│       │   │   ├── 📄 scroll-area.tsx
│       │   │   ├── 📄 select.tsx
│       │   │   ├── 📄 separator.tsx
│       │   │   ├── 📄 sheet.tsx
│       │   │   ├── 📄 sidebar.tsx
│       │   │   ├── 📄 skeleton.tsx
│       │   │   ├── 📄 slider.tsx
│       │   │   ├── 📄 switch.tsx
│       │   │   ├── 📄 table.tsx
│       │   │   ├── 📄 tabs.tsx
│       │   │   ├── 📄 textarea.tsx
│       │   │   ├── 📄 toast.tsx
│       │   │   ├── 📄 toaster.tsx
│       │   │   ├── 📄 toggle-group.tsx
│       │   │   ├── 📄 toggle.tsx
│       │   │   └── 📄 tooltip.tsx
│       │   └── 📁 ui-designer/
│       │       ├── 📄 component-registry.tsx
│       │       └── 📄 dynamic-home-screen.tsx
│       ├── 📁 contexts/
│       │   └── 📄 theme-context.tsx
│       ├── 📄 entry-server.tsx
│       ├── 📁 hooks/
│       │   ├── 📄 use-chat.ts
│       │   ├── 📄 use-global-chat-session.ts
│       │   ├── 📄 use-mobile.tsx
│       │   ├── 📄 use-toast.ts
│       │   └── 📄 useAuth.ts
│       ├── 📁 lib/
│       │   ├── 📄 authUtils.ts
│       │   ├── 📄 client-metadata.ts
│       │   ├── 📄 markdown-utils.ts
│       │   ├── 📄 queryClient.ts
│       │   ├── 📄 stack.ts
│       │   └── 📄 utils.ts
│       ├── 📄 main.tsx
│       ├── 📁 pages/
│       │   ├── 📄 Subscription.tsx
│       │   ├── 📄 add-data.tsx
│       │   ├── 📄 chat-history.tsx
│       │   ├── 📄 chat-widget.tsx
│       │   ├── 📄 chatbot-edit.tsx
│       │   ├── 📄 chatbot-embed.tsx
│       │   ├── 📄 chatbot-form.tsx
│       │   ├── 📄 chatbot-test.tsx
│       │   ├── 📄 contact.tsx
│       │   ├── 📄 dashboard.tsx
│       │   ├── 📄 docs.tsx
│       │   ├── 📄 home.tsx
│       │   ├── 📄 not-found.tsx
│       │   ├── 📄 pricing.tsx
│       │   ├── 📄 privacy.tsx
│       │   ├── 📄 survey-analytics.tsx
│       │   ├── 📄 survey-builder.tsx
│       │   ├── 📄 terms.tsx
│       │   └── 📄 ui-designer.tsx
│       ├── 📁 routes/
│       │   └── 📄 registry.ts
│       └── 📁 types/
│           └── 📄 message-metadata.ts
├── 📄 drizzle.config.ts
├── 📄 postcss.config.js
├── 📁 public/
│   └── 📄 embed.js
├── 📁 server/
│   ├── 📄 ai-response-schema.ts
│   ├── 📄 db.ts
│   ├── 📄 email-service.ts
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
│   ├── 📄 storage.ts
│   ├── 📄 ui-designer-service.ts
│   ├── 📄 upload-service.ts
│   ├── 📄 vite.ts
│   └── 📄 website-scanner.ts
├── 📁 shared/
│   ├── 📄 route-metadata.ts
│   └── 📄 schema.ts
├── 📄 tailwind.config.ts
└── 📄 vite.config.ts

```
