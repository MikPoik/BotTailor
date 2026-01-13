# System Architecture

## Overview
This project is an embeddable customer support chat widget system. It allows users to create AI-powered chatbots that can be embedded on any website via an iframe.

## Data Flow
1. **User Interaction**: A visitor interacts with the chat widget on a website.
2. **Session Initialization**: The widget calls `/api/chat/session` to create or retrieve a session.
3. **Messaging**:
   - User sends a message via POST `/api/chat/message`.
   - The backend (`server/routes/chat.ts`) processes the message, potentially querying RAG (Retrieval Augmented Generation) data from `website_content`.
   - The AI response is generated using OpenAI and saved to the database.
4. **Synchronization**: The client polls GET `/api/chat/messages` to receive updates.

## Component Breakdown
- **UI Designer**: Allows users to customize the "Home Screen" of the chat widget.
- **Survey System**: Supports interactive surveys within the chat flow.
- **Embed System**: Handles the generation and rendering of iframe-based widgets.
- **RAG System**: Scrapes and indexes website content to provide context-aware AI responses.

## Tech Stack
- **Framework**: Express (Backend) / React (Frontend)
- **Database**: PostgreSQL with Drizzle ORM and pgvector for RAG.
- **AI**: OpenAI (GPT-4o/GPT-5.1) for chat and embeddings.
- **Styling**: Tailwind CSS with a custom theme resolution system.
