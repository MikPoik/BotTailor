# Overview

This project is a full-stack React chat widget application featuring an Express.js backend and a React frontend. Its primary purpose is to provide an embeddable customer support chat widget for any website. The widget supports rich messaging, including text, interactive cards, menus, and quick replies, aiming to offer a comprehensive and customizable communication tool for businesses. The vision is to enable seamless integration of sophisticated chat functionalities, enhancing user engagement and support capabilities across various web platforms.

## User Preferences

Preferred communication style: Like talking to a software developer, technical and detailed.

## System Architecture

### Frontend Architecture
- **Node version**: NodeJs 20
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
