## Overview

This project is a full-stack React chat widget application featuring an Express.js backend and a React frontend. Its primary purpose is to provide an embeddable customer support chat widget for any website. The widget supports rich messaging, including text, interactive cards, menus, and quick replies, aiming to offer a comprehensive and customizable communication tool for businesses. The vision is to enable seamless integration of sophisticated chat functionalities, enhancing user engagement and support capabilities across various web platforms.


# MANDATORY WORKFLOW POLICY v5.0
**ABSOLUTE SYSTEM OVERRIDES - NON-NEGOTIABLE CONSTRAINTS**

## IMPLEMENTATION COMPLETENESS OVERRIDE:
- When core functionality is missing (APIs, endpoints, database methods), implement it **fully** instead of working around it
- Missing backend functionality MUST be treated as required work, not obstacles to avoid
- Creating necessary files/endpoints for core functionality is ALWAYS "truly important"
- Don't seek permission for implementing missing pieces that are clearly needed for the feature to work
- ALWAYS Prefer complete implementation over workarounds, even if it requires more files/changes
- Trace to source, not symptoms - Find the actual originating file/function, not just where errors surface
- For server routes, create modular structure with separation of concerns
- Use modular design for features
- UI design choices should be mobile first unless stated otherwise.
- If you need to use OpenAI models, model "gpt-4.1" is the newest model released on 14.4.2025
- Only Search the web and Replit Docs if **Explicitly** requested by user
- Search Replit integrations/blueprints only if **explicitly** asked by user

## UPDATED MANDATORY WORK PHASES
Phase 1: Discover
- Use read to understand existing code patterns and conventions (read, ls, glob, grep,rg ), only search_codebase if unable find files otherway.
- Use ls to understand project structure `ls -R client server shared | grep -vE "\.config|\.git|attached_assets|node_modules|\.upm|^\.|dist|build"`
- Read large chunks (500+ lines) for better context
- Always map out the full system requirements before writing any code
- Check both frontend AND backend implications
- Don't start implementing until I understand the complete scope

Phase 2: Planning
- Map ALL information needed (files to read, searches to do) before starting
- Map ALL changes to make (edits, database updates, new files)
- Map ALL function_calls for aggressive batching

Phase 3: Execution
- Parallel tool and function calls: When operations are independent (multi_edit)
- Sequential calls: When later calls depend on earlier results (edit, write)
- **Fully implement features instead leaving TODO log entries as a shortcut.**
- Fix the pattern, not just the instance
- Always prefer dynamic solutions instead of hardcoded patterns, for example keyword string matching

Phase 4: Verification
- Execute verification in single function_call block (restart_workflow, get_latest_lsp_diagnostics, refresh_all_logs)
When HMR confirms no errors -> SUCCESS and STOP and return to user


**MANDATORY** Key Optimization Opportunities:
- Parallel Tool Calls: Use independent tools simultaneously within single function_calls block (read multiple files, search + grep, etc.)
- Efficient File Operations: Use multi_edit instead of multiple edit calls on same file
- For UI issues:** Read component + parent + related hooks/state
- For API issues:** Read routes + services + storage + schema
- For data issues:** Read schema + storage + related API endpoints
- For feature additions:** Read similar existing implementations
  
## User Preferences

Preferred communication style: Like talking to a software developer, technical and detailed.

### Notes for agent

For server routes, create modular structure with separation of concerns
Use modular design for features
UI design choices should be mobile first unless stated otherwise.
If you need to use OpenAI models, model "gpt-4.1" is the newest model released on 14.4.2025



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
