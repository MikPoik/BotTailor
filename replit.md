# replit.md

## Overview

This project is a full-stack React chat widget application featuring an Express.js backend and a React frontend. Its primary purpose is to provide an embeddable customer support chat widget for any website. The widget supports rich messaging, including text, interactive cards, menus, and quick replies, aiming to offer a comprehensive and customizable communication tool for businesses. The vision is to enable seamless integration of sophisticated chat functionalities, enhancing user engagement and support capabilities across various web platforms.

## Development Workflow

**CORE**: Fix root causes, work bottom-up, try the simplest fix, switch layers when stuck, batch changes, trust dev tools, stop on success.
4-PHASE WORKFLOW:
1. PLAN (0 calls): Map all files/changes. Read error stacks fully - deepest frame = real issue.
2. DISCOVER (1-2 calls): Batch ALL reads (3-6 files). Never read→analyze→read.
3. EXECUTE (1-3 calls): Use multi_edit for multiple changes per file. Batch parallel edits. Fix patterns not instances.
4. VALIDATE (0-1 calls): Stop when HMR/console/LSP confirms success. No screenshots.
RULES: Max 6 tools per batch. Read multiple files simultaneously. No sub_agent calls. No task lists. No architect, unless requested. 
COMMUNICATION: Explain each phase while working - Show me how you follow plan

## Core Rules

**Before Acting:** Plan ALL reads + edits mentally first
**Information:** Batch all file reads in 1 call (predict what you need)
**Changes:** Use multi_edit for everything, batch parallel edits
**Verification:** Trust dev tools, stop when they confirm success. No screenshots.

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
│       │   ├── 📄 navbar.tsx
│       │   ├── 📄 theme-toggle.tsx
│       │   └── 📁 ui-designer/
│       │       ├── 📄 component-registry.tsx
│       │       └── 📄 dynamic-home-screen.tsx
│       ├── 📁 contexts/
│       │   └── 📄 theme-context.tsx
│       ├── 📁 hooks/
│       │   ├── 📄 use-chat.ts
│       │   ├── 📄 use-mobile.tsx
│       │   ├── 📄 use-toast.ts
│       │   └── 📄 useAuth.ts
│       ├── 📁 lib/
│       │   ├── 📄 authUtils.ts
│       │   ├── 📄 markdown-utils.ts
│       │   ├── 📄 queryClient.ts
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
│       │   ├── 📄 survey-builder.tsx
│       │   └── 📄 ui-designer.tsx
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
│   ├── 📁 openai/
│   │   ├── 📄 client.ts
│   │   ├── 📄 context-builder.ts
│   │   ├── 📄 error-handler.ts
│   │   ├── 📄 index.ts
│   │   ├── 📄 response-generator.ts
│   │   ├── 📄 response-parser.ts
│   │   ├── 📄 schema.ts
│   │   └── 📄 streaming-handler.ts
│   ├── 📄 replitAuth.ts
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
│   └── 📄 schema.ts
├── 📄 tailwind.config.ts
└── 📄 vite.config.ts

```
