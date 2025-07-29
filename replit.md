# replit.md

## Overview

This is a full-stack React chat widget application built with Express.js backend and React frontend. The application provides an embeddable chat widget that can be integrated into any website to provide customer support functionality with rich messaging features including text, cards, menus, and interactive options.

## Recent Changes

- **July 29, 2025**: Implemented Complete Color Priority System and Migrated Color Controls to UI Designer:
  - Created color resolution system that prioritizes embed parameters over UI Designer theme colors
  - Updated DynamicHomeScreen component to use resolved colors for consistent styling
  - Modified all UI Designer components (Header, Topics, Quick Actions, etc.) to respect embed color parameters
  - Extended color resolution system to Chat tab interface for complete consistency
  - Applied resolved colors to chat messages area, input section, tab navigation, and empty states
  - Fixed discrepancy where UI Designer theme colors would override embed parameters across all tabs
  - Embed parameters (textColor, backgroundColor, primaryColor) now consistently take precedence throughout widget
  - Added fallback logic: embed parameters → UI Designer theme → default CSS values
  - **MIGRATED COLOR CONTROLS**: Moved color customization from Widget Test page to UI Designer page
  - Added new "Theme" tab in UI Designer with comprehensive color controls (primary, background, text)
  - Integrated theme colors into AI prompts so generated designs automatically use brand colors
  - Updated Widget Test page to focus purely on testing functionality (chatbot selection, position, embed code)
  - Colors configured in UI Designer Theme tab now apply immediately to preview and are included in AI generation prompts
  - Ensures complete brand consistency when widgets are embedded with specific color requirements
  - Both Home and Chat tabs now respect the same color priority system for unified theming
- **July 29, 2025**: Enhanced Widget Theming System with Complete Color Support:
  - Added full theme configuration support (primaryColor, backgroundColor, textColor) to embed.js
  - Updated widget test page with all three color controls and fixed reload loop issue
  - Enhanced embed.css with comprehensive theme variables for consistent styling
  - Added CSS variable injection to parent page for proper theme application
  - Fixed missing PATCH API route for UI designer updates (/api/chatbots/guid/:guid)
  - Implemented dynamic color calculation for light/dark theme variants in embedded widgets
  - External widget embedding now supports: primaryColor, backgroundColor, textColor parameters
  - Widget test page now includes all color controls and prevents infinite reload loops
- **July 29, 2025**: Added Email Configuration for Form Submissions:
  - Added email configuration fields to chatbot schema (recipient & sender settings)
  - Updated chatbot edit form with email configuration section
  - Modified form submission API to use configured email settings from chatbot config
  - Fixed database schema validation to include new email fields in insert operations
  - Form submissions now use chatbot-specific email addresses instead of hardcoded defaults
  - Email settings include: formRecipientEmail, formRecipientName, senderEmail, senderName
  - **CONDITIONAL FORM FUNCTIONALITY**: Forms are now only available when email configuration is properly set up
  - Modified system prompt to conditionally include/exclude form instructions based on email config presence
  - Made email fields truly optional in chatbot edit form to allow saving without email setup
  - When no email config exists, chatbot suggests alternative contact methods instead of offering forms
- **July 28, 2025**: Fixed Widget URL Validation to Prevent Incorrect API Access:
  - Added route guard to block incorrect widget URLs (replit.app/userId/chatbotGuid) and return proper error
  - Enhanced embed.js to validate API URLs contain proper /widget/ path before showing chat bubble
  - Implemented client-side validation to prevent widget initialization with malformed URLs
  - Fixed issue where widgets partially worked with incorrect URL format showing white screens
  - Added helpful error messages directing users to correct URL format (/widget/userId/chatbotGuid)
  - Ensured chat bubbles only appear when proper widget URLs are used for external embeds
- **July 25, 2025**: Fixed chat widget styling discrepancies and improved dimensions:
  - Fixed styling inconsistencies between embedded widget and site widget UI
  - Resolved conflicting inline styles in embed.js that overrode CSS changes
  - Made both widgets wider (450px) and taller (75vh, max 800px, min 600px) for better content display
  - Fixed extra padding issues in embedded widget input area
  - Ensured identical styling between embedded iframe and site widget interfaces
  - Added !important CSS rules to override embed.js inline style conflicts
- **July 25, 2025**: Fixed website source deletion and scanning issues:
  - Fixed API endpoint mismatch between frontend and backend for delete/rescan operations
  - Added comprehensive logging to website scanner for better progress tracking
  - Fixed fetch timeout issues and improved error handling in content extraction
  - Enhanced scanning progress updates and embedding generation error handling
  - Implemented image sitemap and image URL filtering to prevent indexing non-content files
  - Added smart URL validation to exclude image files, media, and non-webpage content
- Change log moved to "changes.md", refer for history and appending notes




## User Preferences

Preferred communication style: Simple, everyday language.

### Notes for agent

You can use

If you need to use OpenAI models, model "gpt-4.1" is the newest model released on 14.4.2025 grep commands to get overview of current routes and functions with these commands when needed:

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

Always test the api routes after changes with "curl" e.g. curl https://localhost:5000 ...
For server routes, create modular structure with separation of concerns
UI design choices should be mobile first unless stated otherwise

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