## Overview

This project is a full-stack React chat widget application featuring an Express.js backend and a React frontend. Its primary purpose is to provide an embeddable customer support chat widget for any website. The widget supports rich messaging, including text, interactive cards, menus, and quick replies, aiming to offer a comprehensive and customizable communication tool for businesses. The vision is to enable seamless integration of sophisticated chat functionalities, enhancing user engagement and support capabilities across various web platforms.

## User Preferences

**REQUIRED MANDATORY** communication style: Like talking to a software developer, technical and detailed.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, Vite for building.
- **UI**: shadcn/ui (Radix UI primitives), Tailwind CSS for styling.
- **State Management**: TanStack Query (React Query) for server state.
- **Routing**: Wouter.
- **UI/UX Decisions**: Mobile-first responsive design; customizable floating chat bubble, full-featured chat UI with message bubbles, typing indicators, and rich content support. Theming is controlled via a color resolution system (embed parameters > UI Designer theme settings > default CSS values). Background images with text readability overlay.

### Backend Architecture
- **Framework**: Express.js with TypeScript, Node.js (ESM modules).
- **Database ORM**: Drizzle ORM for PostgreSQL.
- **Database Provider**: Neon Database (serverless PostgreSQL).
- **Session Management**: In-memory storage with interface for database persistence.

### System Design Choices
- **Chat Widget System**: Customizable floating bubble, full chat interface supporting rich messages (text, cards, menus, quick replies).
- **Message System**: Rich messages with images, titles, descriptions, action buttons. Polling for real-time updates.
- **Data Flow**: Client-initialized sessions, server welcome message, real-time message exchange via polling. Server sends structured messages with interactive elements; client selections trigger server responses.
- **Database Schema**: Users (authentication), Chat Sessions (session management), Messages (rich content via JSON metadata).
- **Theming System**: Color priority system (embed parameters > UI Designer settings > default CSS). Supports primary, background, text colors, and background images. Email configuration for form submissions.
- **Real-time Communication**: HTTP polling for message synchronization, chosen for simpler deployment and broader compatibility over WebSockets.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection.
- **drizzle-orm**: Type-safe database operations.
- **@tanstack/react-query**: Server state management.
- **express**: Web server framework.
- **@radix-ui/*** Accessible UI primitives.
- **tailwindcss**: Utility-first CSS framework.