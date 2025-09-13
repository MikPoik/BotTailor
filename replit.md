# replit.md

## Overview

This project is a full-stack React chat widget application featuring an Express.js backend and a React frontend. Its primary purpose is to provide an embeddable customer support chat widget for any website. The widget supports rich messaging, including text, interactive cards, menus, and quick replies, aiming to offer a comprehensive and customizable communication tool for businesses. The vision is to enable seamless integration of sophisticated chat functionalities, enhancing user engagement and support capabilities across various web platforms.

## Recent Changes

- **September 3, 2025 - Latest**: OpenAI Service Modularization and Architecture Improvements:
  - **MODULAR OPENAI SERVICE**: Refactored monolithic `openai-service.ts` (805 lines) into focused, maintainable modules
  - Created `server/openai/` directory with specialized modules: `client.ts`, `context-builder.ts`, `error-handler.ts`, `response-generator.ts`, `response-parser.ts`, `schema.ts`, `streaming-handler.ts`
  - **IMPROVED MAINTAINABILITY**: Each module handles a single responsibility for easier testing, debugging, and future enhancements
  - **BACKWARD COMPATIBILITY**: Maintained full API compatibility through `server/openai/index.ts` export layer
  - **ENHANCED ERROR HANDLING**: Centralized error handling with consistent fallback responses and logging
  - **CONTEXT SEPARATION**: Website and survey context building logic isolated for better testability
  - **STREAMING OPTIMIZATION**: Modular streaming handler with improved bubble parsing and validation
  - All existing functionality preserved with zero breaking changes

- **September 3, 2025**: Fixed Chat Session Management and UI Designer TypeScript Errors:
  - **FIXED CHAT HISTORY PERSISTENCE**: Resolved issue where logged-in users were seeing previous chat history on page reload
  - Updated session caching to include sessionId in query cache key instead of just chatbotConfigId
  - Each unique sessionId now gets its own cache entry, ensuring fresh conversations for each page load
  - **FIXED UI DESIGNER SERVICE**: Added missing `actionType` property to all default topic objects
  - All topic objects now properly specify `actionType: "message"` as required by the TypeScript interface

- **August 8, 2025**: Enhanced Survey Session Management and Restart Handling:
  - **SMART SURVEY SESSION MANAGEMENT**: Implemented proper handling for completed and restarted surveys
  - System now checks for existing survey sessions before creating new ones
  - Completed surveys can be restarted by resetting the session status and responses
  - Active surveys continue from where they left off instead of creating duplicates
  - **SURVEY-SPECIFIC SESSION TRACKING**: Changed from generic session checking to survey-specific session management
  - Uses `getSurveySession(surveyId, sessionId)` instead of generic session lookup
  - Each survey maintains its own completion state per chat session
  - **IMPROVED CONVERSATIONAL FLOW**: Added proper survey introductions and response acknowledgments
  - Survey now includes introductory message when starting ("Let's begin the survey...")
  - Added acknowledgment responses between questions ("Thank you for your response...")
  - **CONTEXT-AWARE PROMPTS**: System provides different instructions based on survey progress
  - **SIMPLIFIED AI INSTRUCTIONS**: Streamlined system prompts to reduce complexity and improve consistency
  - **INCREASED TOKEN LIMITS**: Raised maxTokens from 1500 to 2000 to prevent truncated menu options
  - **COMPREHENSIVE MENU LOGGING**: Enhanced streaming response validation with detailed menu bubble detection

- **August 8, 2025**: Fixed Survey Context Building in OpenAI Service:
  - Fixed syntax errors in openai-service.ts that prevented proper survey context building
  - Enhanced survey context to include all available survey fields (name, description, title, aiInstructions)
  - Improved completed survey context to show both questions and answers instead of just responses
  - Added proper type casting for surveyConfig access to resolve TypeScript errors
  - Survey context now includes database survey name/description alongside config title/description
  - AI prompts for completed surveys now show full Q&A pairs for better context understanding
  - Survey aiInstructions are now properly injected into AI prompts when available
  - **FIXED ONGOING SURVEYS**: Previous responses now show both questions and answers (Q1: question text, A1: answer) instead of just raw response values
  - AI now has complete context of what questions were asked and how they were answered during survey progression
  - **FIXED QUESTION ID MAPPING**: Resolved mismatch between indexed question IDs (question_0, question_1) used in storage and survey config question lookup
  - Survey context now properly handles both indexed question IDs and original question IDs for maximum compatibility

## User Preferences

Preferred communication style: Simple, everyday language.

### Notes for agent

For server routes, create modular structure with separation of concerns
Use modular design for features
UI design choices should be mobile first unless stated otherwise.
If you need to use OpenAI models, model "gpt-4.1" is the newest model released on 14.4.2025

### Cost-Efficient Workflow for Codebase Changes

**TARGET: 3-5 total tool calls for most modification requests**

**Phase 1: Error Investigation & Discovery (1-2 tool calls max)**
- **Trace to source, not symptoms** - Find the actual originating file/function, not just where errors surface
- **Read error stack traces completely** - The deepest stack frame often contains the real issue
- **Search for error patterns first** before assuming location (e.g., "localStorage" across codebase)
- Use `search_codebase` ONLY if truly don't know where relevant code lives
- Otherwise, directly `read` target files in parallel (batch 3-6 files at once)
- Skip exploratory reading - be surgical about what you need

**Phase 2: Pattern-Based Planning & Execution (1-3 tool calls max)**
- **Plan all related changes upfront** - Don't fix incrementally  
- **Identify change scope before starting** - localStorage issue = all localStorage calls need fixing
- **Apply patterns consistently** - If one component needs safeLocalStorage, likely others do too
- **Group by file impact** - All changes to same file in one `multi_edit`
- Use parallel `edit` calls for changes across different files
- **Fix root causes, not band-aids** - One proper fix beats multiple symptom patches

**Phase 3: Selective Validation (0-1 tool calls)**
- Skip validation for simple/obvious changes (< 5 lines, defensive patterns, imports)
- Only use expensive validation tools for substantial changes
- Stop immediately when development tools confirm success

**Phase 4: Trust Development Environment (0-1 tool calls)**
- Skip verification if HMR shows successful reload
- One `restart_workflow` only if runtime actually fails

### TOOL SELECTION MATRIX

**High-Value, Low-Cost (use liberally):**
- `read` (batch 3-6 files), `edit`/`multi_edit`, `grep` with specific patterns

**Medium-Cost (use judiciously):**
- `search_codebase` (only when truly lost), `get_latest_lsp_diagnostics` (complex changes only)

**High-Cost (use sparingly):**
- `architect` (major issues only), `screenshot` (substantial changes only), `restart_workflow` (actual failures only)

### ENFORCED RULES AND POLICIES

**VERIFICATION STOPPING CONDITIONS - Stop immediately when:**
- HMR shows successful reload
- Console logs show expected behavior  
- LSP errors cleared for simple syntax fixes
- Development server responds correctly

**NEVER verify when:**
- Change is < 5 lines of obvious code
- Only added try-catch wrappers or similar defensive patterns
- Just moved/renamed variables or functions
- Only updated imports or type annotations

**PARALLEL EXECUTION RULES:**
- **Read multiple files simultaneously** when investigating related issues
- **Apply edits in parallel** when files are independent
- **Never serialize independent operations** - batch aggressively
- **Maximum 6 tools per batch** to prevent overwhelming output

**MANDATORY WORKFLOW ADHERENCE:**
- **MAXIMUM 5 tool calls** for any change request
- **No exploration** - be surgical about file reading
- **No incremental changes** - make all related edits in one batch
- **No workflow restarts** unless runtime actually fails (not just for verification)

**DEFENSIVE CODING PATTERNS:**
- **Apply sandbox-safe patterns by default** (safeLocalStorage, safe DOM access)
- **Wrap external API calls** in try-catch from the start
- **Use null-safe operations** for optional properties
- **Apply security patterns consistently** across similar code

**VERIFICATION ANXIETY PREVENTION:**
- Stop checking once the development environment confirms success
- Resist urge to "double-check" working changes
- Trust professional development tools over manual verification
- Remember: More verification ≠ better quality, just higher cost
  
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