# replit.md

## Overview

This is a full-stack React chat widget application built with Express.js backend and React frontend. The application provides an embeddable chat widget that can be integrated into any website to provide customer support functionality with rich messaging features including text, cards, menus, and interactive options.

## Recent Changes

- **July 21, 2025**: Enhanced Default Chatbot Security and Configuration:
  - **IMPROVED**: Updated default chatbot configuration to match embeddable widget security model
  - **ENHANCED**: Default chatbot now requires both `DEFAULT_SITE_CHATBOT_GUID` and `DEFAULT_SITE_ADMIN_USER_ID` environment variables
  - **SECURITY**: Added ownership verification for default chatbot using `getChatbotConfigByGuid(userId, guid)` method
  - **CONSISTENCY**: Default chatbot route now works identically to embeddable widget with proper user context
  - **USER EXPERIENCE**: Updated configuration hints on home page and dashboard to show both required environment variables
  - **RESOLVED**: Fixed inconsistency where default chatbot used global GUID lookup while embeddable widget used user-scoped lookup
  - **PRODUCTION READY**: Default chatbot configuration now secure and consistent with existing widget security patterns

- **July 21, 2025**: Completed Survey System Phase 2 - AI Integration & Session Management:
  - **COMPLETED**: Comprehensive survey system with AI context injection and session management
  - Implemented survey context injection with `buildSurveyContext()` function for AI prompts
  - Added automatic survey response recording in chat option selection flow
  - Created survey session management endpoints: start-survey, survey-response, survey-status
  - Added public API endpoint for getting available surveys for home screen integration
  - Enhanced home screen schema to support survey launchers with `actionType: 'survey'` 
  - Integrated survey flow into existing chat streaming with progress tracking
  - Added survey session database operations: create, update, get by session ID
  - Implemented automatic question progression and completion detection
  - Created comprehensive survey context for AI including current question, progress, and previous responses
  - **FIXED**: Survey ID selection from home screen actions - specific surveys now properly selected instead of defaulting to first
  - **ENHANCED**: Clean chat display - surveyId hidden from user messages while maintaining backend functionality
  - **PRODUCTION READY**: Complete survey system from builder to AI-powered conversational flow with proper survey selection
  - **TESTED**: Survey creation, AI context injection, session management, response recording, and specific survey ID targeting

- **July 18, 2025**: Implemented Survey System Phase 1 - Survey Builder:
  - **COMPLETED**: Added comprehensive survey system foundation with database schema and API
  - Created new database tables: `surveys` (survey definitions) and `survey_sessions` (user progress tracking)
  - Implemented PostgreSQL survey configuration storage using JSON fields for flexible survey structures
  - Built comprehensive survey builder interface with tabbed UI for questions, settings, and preview
  - Added full CRUD API endpoints for survey management with proper authentication and ownership verification
  - Created survey schema with support for single/multiple choice, text input, rating, and conditional flow
  - Added survey builder link to dashboard with BarChart3 icon for easy access
  - Integrated survey routing in App.tsx with proper URL structure: `/chatbots/:chatbotId/surveys`
  - **READY FOR TESTING**: Survey builder UI allows creating, editing, and managing surveys with question types and options

- **July 18, 2025**: Enhanced Message Context and Survey Flow Consistency:
  - **FIXED**: Simplified all interactive message representation in conversation history from complex JSON to clean summaries
  - **IMPROVED**: AI now receives digestible formats for all message types:
    - Menu: "[MENU] Presented options: option1, option2, option3"
    - Quick Replies: "[QUICKREPLIES] Suggested replies: reply1, reply2"
    - Forms: "[FORM] Contact form with fields: name, email, message"
    - Cards: "[CARD] Card Title"
  - **ENHANCED**: Added explicit survey consistency rules requiring every question to include menu options
  - **RESOLVED**: Menu consistency issues in multi-step surveys and questionnaires
  - **CLEANED**: Removed "payload: undefined" from option selection messages for cleaner AI context
  - Applied changes to all conversation history mappings: streaming messages, option selection, and bot response functions
  - Added robust error handling with response salvage mechanism for schema validation failures
  - Enhanced system prompt with explicit requirements for bubbles array structure and survey flow rules
  - **PRODUCTION READY**: Survey chatbots now maintain consistent interactive message presentation throughout conversation flow

- **July 16, 2025**: Successfully Implemented pgvector Vector Similarity Search:
  - **COMPLETED**: Full pgvector integration with OpenAI embeddings for semantic content search
  - Fixed vector storage format using proper SQL casting (`::vector`) for PostgreSQL pgvector extension
  - Updated database schema to use `vector(1536)` data type matching OpenAI's text-embedding-ada-002 dimensions
  - Implemented cosine similarity search using pgvector's `<=>` operator for accurate semantic matching
  - AI responses now include 3 most relevant website content chunks based on vector similarity
  - Verified working: Website scanning generates embeddings, stores them properly, and performs accurate semantic search
  - Users can add website URLs that get automatically scanned and converted to searchable vector embeddings
  - **PRODUCTION READY**: Vector similarity search providing contextually relevant AI responses

- **July 15, 2025**: Implemented Website Context Feature for AI-Powered Chatbots:
  - Added comprehensive website scanning and content extraction system using Playwright and Cheerio
  - Created vector-based content storage with PostgreSQL database schema (websiteSources, websiteContent tables)
  - Implemented HTML parsing pipeline that automatically discovers sitemaps and extracts relevant text content
  - Created "Add Data" management page with URL input, scanning progress tracking, and content management
  - Integrated website context into OpenAI response generation for more accurate, relevant chatbot answers
  - Added API endpoints for website source CRUD operations with proper authentication and ownership verification

- **July 15, 2025**: Implemented Avatar Upload with Replit Object Storage Integration:
  - Added comprehensive avatar upload system using Replit Object Storage with "chatbot-avatars" bucket
  - Created reusable AvatarUpload component with tabbed interface for file upload vs URL input
  - Integrated Sharp image processing for automatic resizing to 200x200px and compression
  - Added multer middleware for handling file uploads with 10MB size limit and image type validation
  - Implemented secure file serving endpoints with proper content-type headers and caching
  - Updated both chatbot creation and edit forms to use new avatar upload functionality
  - Fixed object storage data handling by switching to base64 encoding approach (works around downloadAsBytes issues)
  - Resolved mobile viewport scaling problems with proper CSS font-size controls and text-size-adjust settings
  - Users can now upload custom avatar images or use image URLs for their chatbots
  - **CONFIRMED WORKING**: Avatar upload, processing, and serving fully functional in production environment

- **July 15, 2025**: Fixed Embedded Widget Production Path and Security Issues:
  - Fixed production deployment path resolution for widget routes (`../dist/public` instead of `./public`)
  - Removed CORS security warnings by adjusting iframe sandbox attributes
  - Fixed embedded widget authentication bypass for public access without login prompts
  - Resolved white screen issue when embedding specific chatbot GUIDs in production
  - Fixed embed.js URL construction to properly handle specific widget paths vs base URLs
  - Widget embedding with specific bot configurations now works correctly in deployed environment
  - **CONFIRMED WORKING**: Embedded widgets with specific chatbot GUIDs load properly and maintain configuration

- **July 15, 2025**: Implemented AI-Powered UI Designer for Custom Home Screens:
  - Created complete component registry system with dynamic home screen rendering
  - Built AI-powered UI designer service using OpenAI for generating layouts from natural language
  - Implemented three-panel UI designer page with chat interface, live preview, and JSON code view
  - Added comprehensive schema support for home screen components (text, cards, quick actions, chat topics)
  - Integrated custom home screen loading throughout chat widget system for personalized user experiences
  - Extended database schema with homeScreenConfig field for storing custom UI layouts
  - Updated public API endpoints to include home screen configurations for widget embedding

- **July 15, 2025**: Fixed Chatbot Testing and Embed Code Issues:
  - Fixed chatbot testing feature to properly use updated configuration during testing
  - Enhanced session management to update chatbot configuration when testing
  - Modified streaming API to accept chatbotConfigId parameter for proper config binding
  - Updated embed.js to make sessionId optional - server generates it if not provided
  - Improved chat session linking with specific chatbot configurations for accurate testing
  - Fixed issue where testing would use default system prompt instead of chatbot-specific prompt

- **July 15, 2025**: Implemented Test Chatbot Feature:
  - Added dedicated test page `/chatbots/:id/test` for live chatbot testing
  - Created TabbedChatInterface component with chatbot-specific configuration support
  - Updated useChat hook to accept optional chatbotConfigId parameter for targeted testing
  - Enhanced chat session creation to link sessions with specific chatbot configurations
  - Added embedding instructions with copy-paste code generation for easy website integration
  - Maintained backward compatibility for existing chat widgets and interfaces
  - Users can now test their chatbots with actual AI responses before embedding

- **July 12, 2025**: Added Avatar Upload Functionality:
  - Enhanced chatbot schema with `avatarUrl` field for storing avatar image URLs
  - Added comprehensive avatar upload UI to chatbot creation form with live preview
  - Implemented URL-based avatar input with clear functionality
  - Added placeholder for future file upload functionality with object storage
  - Fixed server-side validation to properly handle client requests without userId
  - Streamlined form submission process and removed debugging code

- **July 11, 2025**: Successfully integrated Replit Authentication and Database:
  - Added PostgreSQL database connection and schema migration
  - Implemented Replit Auth with OpenID Connect integration
  - Created comprehensive user authentication system with session management
  - Added database storage for users, chat sessions, messages, and chatbot configurations
  - Built top navigation bar with authentication state management
  - Created landing page for logged-out users and dashboard for authenticated users
  - Established chatbot configuration system for AI personality management
  - Added protected API endpoints for chatbot CRUD operations
  - Updated project architecture to support multi-user environment with role-based access

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