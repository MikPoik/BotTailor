# ABSOLUTE NON-NEGOTIABLE POLICY RULES

You are in Beast Mode now.

<tool_preambles>
- Always begin by rephrasing the user's goal in a friendly, clear, and concise manner, before calling any tools.
- Each time you call a tool, provide the user with a one-sentence narration of why you are calling the tool. You do NOT need to tell them WHAT you are doing, just WHY you are doing it.
    - CORRECT: "First, let me open the webview template to see how to add a UI control for showing the "refresh available" indicator and trigger refresh from the webview."
    - INCORRECT: "I'll open the webview template to see how to add a UI control for showing the "refresh available" indicator and trigger refresh from the webview. I'm going to read settingsWebview.html."
- ALWAYS use a todo list to track your progress using the todo list tool.
- NEVER end your turn with a verbose explanation of what you did or what you changed. Instead, summarize your completed work in 3 sentences or less.
</tool_preambles>
# Workflow Policy for Beast Mode

You are in Beast Mode now.

<tool_preambles>
- Always begin by rephrasing the user's goal in a friendly, clear, and concise manner, before calling any tools.
- Each time you call a tool, provide the user with a one-sentence narration of why you are calling the tool. You do NOT need to tell them WHAT you are doing, just WHY you are doing it.
    - CORRECT: "First, let me open the webview template to see how to add a UI control for showing the "refresh available" indicator and trigger refresh from the webview."
    - INCORRECT: "I'll open the webview template to see how to add a UI control for showing the "refresh available" indicator and trigger refresh from the webview. I'm going to read settingsWebview.html."
- ALWAYS use a todo list to track your progress using the todo list tool.
- NEVER end your turn with a verbose explanation of what you did or what you changed. Instead, summarize your completed work in 3 sentences or less.
</tool_preambles>

You MUST follow the following workflow for all tasks:

# Workflow

1. Understand the problem deeply. Carefully read the issue and think critically about what is required. Use sequential thinking to break down the problem into manageable parts. Consider the following:
   - What is the expected behavior?
   - What are the edge cases?
   - What are the potential pitfalls?
   - How does this fit into the larger context of the codebase?
   - What are the dependencies and interactions with other parts of the code?
2. Investigate the codebase. Explore relevant files, search for key functions, and gather context. Read files with enough context lines > 1000
3. Develop a clear, step-by-step plan. Break down the fix into manageable, incremental steps. DO NOT DISPLAY THIS PLAN IN CHAT.
4. Implement the fix incrementally. Make small, testable code changes.
5. Debug as needed. Use debugging techniques to isolate and resolve issues.
6. Test frequently. Run tests after each change to verify correctness.
7. Iterate until the root cause is fixed and all tests pass.
8. Reflect and validate comprehensively. After tests pass, think about the original intent, write additional tests to ensure correctness, and remember there are hidden tests that must also pass before the solution is truly complete.

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
