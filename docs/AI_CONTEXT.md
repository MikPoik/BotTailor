# AI Context & Codebase Map

This file provides a high-level mapping of the codebase for AI agents to understand the system architecture and core flows.

## Core Architecture
- **Backend**: Express.js with Drizzle ORM (PostgreSQL via Neon).
- **Frontend**: React with Vite, Tailwind CSS, and TanStack Query.
- **Authentication**: Integrated with Replit Auth (Neon Auth).
- **Real-time**: HTTP Polling for message synchronization.

## Key Files & Responsibilities
### server/index.ts
**Description**: Server entry point and middleware configuration

```typescript
/**
 * Main entry point for the Express server.
 * Configures middleware, API routes, authentication, and static file serving.
 */
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupNeonAuth } from "./neonAuth";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Handle webhook routes BEFORE JSON parsing to preserve raw body for Stripe signature verification
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// Apply JSON parsing to all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable trust proxy for proper IP forwarding
app.set('trust proxy', true);

// Configure CORS to allow cross-origin requests for the embed widget
app.use(cors({
  origin: true, // Allow all origins for embed script
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Stack-User-Id', 'x-stack-user-id']
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
... [rest of file omitted]
```

### server/storage.ts
**Description**: Database storage interface and implementation

```typescript
/**
 * Storage interface and implementation for the application.
 * Handles database operations for users, chat sessions, messages, and configurations.
 */
import {
  users,
  chatSessions,
  messages,
  chatbotConfigs,
  websiteSources,
  websiteContent,
  surveys,
  surveySessions,
  subscriptionPlans,
  subscriptions,
  type User,
  type UpsertUser,
  type ChatSession,
  type InsertChatSession,
  type Message,
  type InsertMessage,
  type ChatbotConfig,
  type InsertChatbotConfig,
  type WebsiteSource,
  type InsertWebsiteSource,
  type WebsiteContent,
  type InsertWebsiteContent,
  type Survey,
  type InsertSurvey,
  type SurveySession,
  type InsertSurveySession,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type Subscription,
  type InsertSubscription,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, sql, asc, desc, like } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Chat session methods
  getChatSession(sessionId: string): Promise<ChatSession | undefined>;
  getChatSessionsByChatbotGuid(chatbotGuid: string, offset?: number, limit?: number): Promise<ChatSession[]>;
  getChatSessionsCountByChatbotGuid(chatbotGuid: string): Promise<number>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(sessionId: string, data: Partial<ChatSession>): Promise<ChatSession | undefined>;
... [rest of file omitted]
```

### shared/schema.ts
**Description**: Database schema and type definitions

```typescript
/**
 * Database schema definitions using Drizzle ORM.
 * Includes tables for users, chatbots, sessions, messages, and surveys.
 */
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  real,
  vector,
  pgSchema,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Neon Auth managed schema - reference only, not for migrations
export const neonAuthSchema = pgSchema("neon_auth");
export const neonAuthUsers = neonAuthSchema.table("users_sync", {
  id: text("id").primaryKey(),
  rawJson: jsonb("raw_json"),
  name: text("name"),
  email: text("email"),
  createdAt: timestamp("created_at"),
  deletedAt: timestamp("deleted_at"),
  updatedAt: timestamp("updated_at"),
});

// App-specific user data (references Neon Auth users by ID)
export const users = pgTable("users", {
  id: text("id").primaryKey().notNull(), // References neon_auth.users_sync.id
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Chatbot Configuration table
export const chatbotConfigs = pgTable("chatbot_configs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  guid: varchar("guid").notNull().unique().$defaultFn(() => uuidv4()), // Unique identifier for public URLs and identifying chatbots. Use this for api's for identifying chatbots
... [rest of file omitted]
```

### client/src/App.tsx
**Description**: Frontend routing and main application structure

```typescript
/**
 * Root component for the React frontend application.
 * Sets up routing, providers (Auth, Theme, Query), and global UI elements.
 */
import React, { Suspense, useEffect,useRef } from "react";
import { Switch, Route, useLocation } from "wouter";
import { CookieConsentModal, CookieConsentStatus } from "@/components/cookie-consent-modal";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ClientOnly } from "@/components/client-only";
import NotFound from "@/pages/not-found";
import ChatWidget from "@/pages/chat-widget";
import { normalizeRoutePath } from "@shared/route-metadata";
import { shouldSSR } from "@/routes/registry";
import { StackProvider, StackHandler, StackTheme, useUser } from '@stackframe/react';
import { stackClientApp } from '@/lib/stack';
import { apiRequest } from "@/lib/queryClient";

import Dashboard from "@/pages/dashboard";
import Home from "@/pages/home";
import ChatbotForm from "@/pages/chatbot-form";
import ChatbotEdit from "@/pages/chatbot-edit";
import ChatbotTest from "@/pages/chatbot-test";
import UIDesigner from "@/pages/ui-designer";
import AddData from "@/pages/add-data";
import SurveyBuilder from "@/pages/survey-builder";
import SurveyAnalytics from "@/pages/survey-analytics";
import ChatHistory from "@/pages/chat-history";
import ChatbotEmbed from "@/pages/chatbot-embed";
import EmbedPage from "@/pages/embed";
import EmbedDesignsPage from "@/pages/embed-designs";
import EmbedDesignEditPage from "@/pages/embed-design-edit";
import Docs from "@/pages/docs";
import Pricing from "@/pages/pricing";
import Subscription from "@/pages/Subscription";
import Contact from "@/pages/contact";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";

function HandlerRoutes() {
  const [location] = useLocation();
  return (
    <StackHandler app={stackClientApp} location={location} fullPage />
  );
... [rest of file omitted]
```

### server/routes/chat.ts
**Description**: Core chat logic and AI response handling

```typescript
import type { Express } from "express";
import { storage } from "../storage";
import { insertMessageSchema, type ChatSession } from "@shared/schema";
import { z } from "zod";
import { generateStreamingResponse } from "../openai";
import { buildSurveyContext } from "../ai-response-schema";
import { brevoEmailService, FormSubmissionData } from "../email-service";
import { isAuthenticated } from "../neonAuth";


// Chat-related routes
export function setupChatRoutes(app: Express) {
  // Select option route (required for menu option interactions)
  app.post("/api/chat/:sessionId/select-option", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { optionId, payload, optionText } = req.body;

      console.log(
        `[SELECT_OPTION] Session: ${sessionId}, Option: ${optionId}, Text: ${optionText}`,
      );

      // Check if there's an active survey session and record the response
      let surveyResponseRecorded = false;
      try {
        const surveySession = await storage.getActiveSurveySession(sessionId);
        console.log(
          `[SURVEY RESPONSE] Active survey session check:`,
          surveySession
            ? {
                id: surveySession.id,
                surveyId: surveySession.surveyId,
                status: surveySession.status,
                currentQuestionIndex: surveySession.currentQuestionIndex,
              }
            : null,
        );

        if (surveySession && surveySession.status === "active") {
          // Get the survey to find the current question
          const survey = await storage.getSurvey(surveySession.surveyId);
          const surveyConfig = survey?.surveyConfig as any;
          if (survey && surveyConfig?.questions) {
            const questionIndex = surveySession.currentQuestionIndex || 0;
            const currentQuestion = surveyConfig.questions[questionIndex];

            if (currentQuestion) {
              console.log(
                `[SURVEY RESPONSE] Recording response for question: ${currentQuestion.text}`,
              );
... [rest of file omitted]
```

