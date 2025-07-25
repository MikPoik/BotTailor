# replit.md

## Overview

This is a full-stack React chat widget application built with Express.js backend and React frontend. The application provides an embeddable chat widget that can be integrated into any website to provide customer support functionality with rich messaging features including text, cards, menus, and interactive options.

## Recent Changes

- Change log moved to "changes.md", refer for history and appending notes

## Notes for agent

You can use grep commands to get overview of current routes and functions with these commands when needed:

For JavaScript/TypeScript function declarations:
grep -r -n "^ *app\." server/

For JavaScript/TypeScript function declarations:
grep -r -n "^ *\(function\|export function\|async function\)" server/

For arrow functions and method definitions:
grep -r -n "^ *\(const\|let\|var\).*=.*=>" server/

For TypeScript/JavaScript methods in classes or objects:
grep -r -n "^ *[a-zA-Z_][a-zA-Z0-9_]*\s*(" server/

For Express route handlers specifically:
grep -r -n "^ *app\.\(get\|post\|put\|delete\|patch\)" server/


## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ESM modules
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: In-memory storage with interface for database persistence

### Data Storage
- **Database**: PostgreSQL via Neon Database serverless
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Migration Strategy**: Drizzle Kit for schema migrations
- **Current Implementation**: Dual storage system with MemStorage for development and database interface for production

## Key Components

### Chat Widget System
- **Widget Container**: Floating chat bubble with customizable positioning (bottom-right/bottom-left)
- **Chat Interface**: Full-featured chat UI with message bubbles, typing indicators, and rich content support
- **Message Types**: Text messages, interactive cards, menu options, and quick replies
- **Responsive Design**: Mobile-optimized with different layouts for desktop and mobile devices

### Message System
- **Rich Messages**: Support for cards with images, titles, descriptions, and action buttons
- **Interactive Menus**: Option selection with custom payloads
- **Quick Replies**: Predefined response buttons for common queries
- **Real-time Updates**: Polling-based message synchronization

### Database Schema
- **Users Table**: Basic user authentication (id, username, password)
- **Chat Sessions**: Session management with unique session IDs
- **Messages Table**: Comprehensive message storage with support for rich content via JSON metadata

## Data Flow

1. **Session Initialization**: Client requests session creation with generated session ID
2. **Welcome Flow**: Server automatically sends welcome message and menu options
3. **Message Exchange**: Real-time message sending and receiving with polling
4. **Rich Content**: Server can send structured messages with interactive elements
5. **Option Selection**: Client can select menu options which trigger server responses

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **express**: Web server framework
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **tsx**: TypeScript execution for development
- **vite**: Frontend build tool with HMR
- **esbuild**: Backend bundling for production
- **@replit/vite-plugin-runtime-error-modal**: Development error handling

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `dist/public`
- **Backend**: esbuild bundles Express server to `dist/index.js`
- **Database**: Drizzle migrations run via `db:push` command

### Environment Requirements
- **DATABASE_URL**: PostgreSQL connection string (required for production)
- **NODE_ENV**: Environment setting (development/production)

### Embedding Strategy
- **Widget Embedding**: JavaScript snippet loads chat widget into any website
- **Cross-Origin Support**: CORS configuration for multi-domain deployment
- **Customization**: Runtime theming and positioning options

### Development vs Production
- **Development**: Uses in-memory storage and Vite dev server
- **Production**: Connects to PostgreSQL database and serves static files
- **Replit Integration**: Special handling for Replit development environment

## Architecture Decisions

### Database Choice
- **Decision**: PostgreSQL with Drizzle ORM
- **Rationale**: Type safety, serverless compatibility, and robust schema management
- **Alternative**: Could use SQLite for simpler deployments
- **Trade-offs**: More complex setup but better scalability and type safety

### State Management
- **Decision**: TanStack Query for server state
- **Rationale**: Excellent caching, background updates, and React integration
- **Alternative**: Redux Toolkit Query or SWR
- **Trade-offs**: Learning curve but powerful features for real-time applications

### UI Framework
- **Decision**: shadcn/ui with Radix UI primitives
- **Rationale**: Accessible, customizable, and modern design system
- **Alternative**: Material-UI or Ant Design
- **Trade-offs**: Requires more setup but provides full design control

### Real-time Communication
- **Decision**: HTTP polling instead of WebSockets
- **Rationale**: Simpler deployment, better compatibility with various hosting environments
- **Alternative**: WebSockets or Server-Sent Events
- **Trade-offs**: Less efficient but more reliable across different network conditions