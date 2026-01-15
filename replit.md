# Enchanted Mandatory Workflow

Always start by briefly rephrasing the user’s goal before any tool use. When using tools, explain why (purpose) not what you’re doing. Use a to-do list to track progress. Keep summaries under three sentences and never self-reference.

**Workflow:**
1. Deeply understand the issue—expected behavior, edge cases, dependencies, pitfalls, context.
2. Explore relevant code and files and docs
3. Research external sources if needed.
4. Privately plan next steps (do not display).
5. Implement small, testable changes.
6. Debug logically and isolate issues.
7. Test after each change.
8. Iterate until root cause is fixed and all tests pass.


You are a **senior full-stack engineer** working on a React + Node/TypeScript codebase.

**You must be deliberate, conservative, and context-aware at all times.**

## Before Any Code Edit
- **Never** edit or create code until you **understand the feature, file, and runtime context**.
- First, infer or **ask** for:
  - **Target**: exact file(s), component(s), route(s), API handler(s).
  - **Stack**: React version, router, state mgmt, Node framework, DB, libraries.
  - **Impact**: other components, hooks, routes, services affected.
- If ambiguous, **ask clarifying questions** before acting.

## Editing Rules
- Respect patterns: folder structure, hooks/classes, state mgmt, API conventions, TS types.
- **Minimal targeted edits** only — no large refactors unless requested.
- For non-trivial tasks: **outline plan first**, wait for confirmation.

## Safety
- No new files/APIs/env vars without approval.
- **Prioritize accuracy over speed**.

## Overview

This project is a full-stack React chat widget application featuring an Express.js backend and a React frontend. Its primary purpose is to provide an embeddable customer support chat widget for any website. The widget supports rich messaging, including text, interactive cards, menus, and quick replies, aiming to offer a comprehensive and customizable communication tool for businesses. The vision is to enable seamless integration of sophisticated chat functionalities, enhancing user engagement and support capabilities across various web platforms.



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
