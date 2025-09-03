# replit.md

## Overview

This project is a full-stack React chat widget application featuring an Express.js backend and a React frontend. Its primary purpose is to provide an embeddable customer support chat widget for any website. The widget supports rich messaging, including text, interactive cards, menus, and quick replies, aiming to offer a comprehensive and customizable communication tool for businesses. The vision is to enable seamless integration of sophisticated chat functionalities, enhancing user engagement and support capabilities across various web platforms.

## Recent Changes

- **September 3, 2025 - Latest**: Fixed Chat Session Management and UI Designer TypeScript Errors:
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

Always test the api routes after changes with "curl" e.g. curl https://localhost:5000 ...

For server routes, create modular structure with separation of concerns
UI design choices should be mobile first unless stated otherwise.
Prioritize Replit services to third-party services e.g. database, ObjectStorage, Authentication and so on.
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