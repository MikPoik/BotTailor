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
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Session storage table for Replit Auth (required)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth (required)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
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
  name: text("name").notNull(),
  description: text("description"),
  avatarUrl: varchar("avatar_url"),
  systemPrompt: text("system_prompt").notNull(),
  model: text("model").notNull().default("gpt-4o-mini"),
  temperature: integer("temperature").default(7), // 0-10 scale (will divide by 10)
  maxTokens: integer("max_tokens").default(1000),
  isActive: boolean("is_active").default(true),
  welcomeMessage: text("welcome_message"),
  fallbackMessage: text("fallback_message"),
  homeScreenConfig: jsonb("home_screen_config"), // Dynamic UI configuration
  initialMessages: jsonb("initial_messages"), // Initial message bubbles for embed widget
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  chatbotConfigId: integer("chatbot_config_id").references(() => chatbotConfigs.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => chatSessions.sessionId),
  content: text("content").notNull(),
  sender: text("sender").notNull(), // 'user' | 'bot'
  messageType: text("message_type").notNull().default("text"), // 'text' | 'card' | 'menu' | 'image'
  metadata: jsonb("metadata"), // For rich content data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Website Sources table for storing website URLs and metadata
export const websiteSources = pgTable("website_sources", {
  id: serial("id").primaryKey(),
  chatbotConfigId: integer("chatbot_config_id").notNull().references(() => chatbotConfigs.id),
  url: varchar("url", { length: 2048 }).notNull(),
  title: text("title"),
  description: text("description"),
  sitemapUrl: varchar("sitemap_url", { length: 2048 }),
  lastScanned: timestamp("last_scanned"),
  totalPages: integer("total_pages").default(0),
  status: text("status").notNull().default("pending"), // 'pending' | 'scanning' | 'completed' | 'error'
  errorMessage: text("error_message"),
  maxPages: integer("max_pages").default(50), // Cap on pages to scan
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Website Content table for storing parsed content with embeddings
export const websiteContent = pgTable("website_content", {
  id: serial("id").primaryKey(),
  websiteSourceId: integer("website_source_id").notNull().references(() => websiteSources.id),
  url: varchar("url", { length: 2048 }).notNull(),
  title: text("title"),
  content: text("content").notNull(),
  contentType: text("content_type").default("text"), // 'text' | 'heading' | 'paragraph'
  wordCount: integer("word_count"),
  embedding: vector("embedding", { dimensions: 1536 }), // OpenAI ada-002 embedding size
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Survey Configuration table for storing survey definitions
export const surveys = pgTable("surveys", {
  id: serial("id").primaryKey(),
  chatbotConfigId: integer("chatbot_config_id").notNull().references(() => chatbotConfigs.id),
  name: text("name").notNull(),
  description: text("description"),
  surveyConfig: jsonb("survey_config").notNull(), // Survey structure with questions and flow
  status: text("status").notNull().default("draft"), // 'draft' | 'active' | 'archived'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Survey Sessions table for tracking user progress through surveys
export const surveySessions = pgTable("survey_sessions", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").notNull().references(() => surveys.id),
  sessionId: text("session_id").notNull().references(() => chatSessions.sessionId),
  userId: varchar("user_id").references(() => users.id),
  currentQuestionIndex: integer("current_question_index").default(0),
  responses: jsonb("responses").default({}), // Stores all user responses
  status: text("status").notNull().default("active"), // 'active' | 'completed' | 'abandoned'
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Replit Auth user upsert schema
export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

// Chatbot config schemas
export const insertChatbotConfigSchema = createInsertSchema(chatbotConfigs).pick({
  userId: true,
  guid: true,
  name: true,
  description: true,
  avatarUrl: true,
  systemPrompt: true,
  model: true,
  temperature: true,
  maxTokens: true,
  welcomeMessage: true,
  fallbackMessage: true,
  homeScreenConfig: true,
  initialMessages: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  sessionId: true,
  userId: true,
  chatbotConfigId: true,
});

export const insertMessageSchema = z.object({
  sessionId: z.string(),
  content: z.string(),
  sender: z.enum(["user", "bot", "assistant"]),
  messageType: z.enum(["text", "image", "audio", "video", "file", "card", "menu", "quickReplies", "form", "system"]).default("text"),
  metadata: z.record(z.any()).default({}),
});

// Website sources schemas
export const insertWebsiteSourceSchema = createInsertSchema(websiteSources).pick({
  chatbotConfigId: true,
  url: true,
  title: true,
  description: true,
  sitemapUrl: true,
  maxPages: true,
});

export const insertWebsiteContentSchema = createInsertSchema(websiteContent).omit({
  id: true,
  embedding: true,
  createdAt: true,
});

// Type exports
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type ChatbotConfig = typeof chatbotConfigs.$inferSelect;
export type InsertChatbotConfig = z.infer<typeof insertChatbotConfigSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Website source types
export type WebsiteSource = typeof websiteSources.$inferSelect;
export type InsertWebsiteSource = z.infer<typeof insertWebsiteSourceSchema>;
export type WebsiteContent = typeof websiteContent.$inferSelect;
export type InsertWebsiteContent = z.infer<typeof insertWebsiteContentSchema>;

// Survey schemas
export const insertSurveySchema = createInsertSchema(surveys).pick({
  chatbotConfigId: true,
  name: true,
  description: true,
  surveyConfig: true,
  status: true,
});

export const insertSurveySessionSchema = createInsertSchema(surveySessions).pick({
  surveyId: true,
  sessionId: true,
  userId: true,
  currentQuestionIndex: true,
  responses: true,
  status: true,
}).partial({ userId: true });

// Survey types
export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = z.infer<typeof insertSurveySchema>;
export type SurveySession = typeof surveySessions.$inferSelect;
export type InsertSurveySession = z.infer<typeof insertSurveySessionSchema>;

// Rich message types
export const RichMessageSchema = z.object({
  type: z.enum(['text', 'card', 'menu', 'image', 'quickReplies', 'form']),
  content: z.string(),
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    buttons: z.array(z.object({
      id: z.string(),
      text: z.string(),
      action: z.string(),
      payload: z.any().optional(),
    })).optional(),
    options: z.array(z.object({
      id: z.string(),
      text: z.string(),
      icon: z.string().optional(),
      action: z.string(),
      payload: z.any().optional(),
    })).optional(),
    quickReplies: z.array(z.string()).optional(),
    formFields: z.array(z.object({
      id: z.string(),
      label: z.string(),
      type: z.enum(['text', 'email', 'textarea','form']),
      placeholder: z.string().optional(),
      required: z.boolean().optional(),
      value: z.string().optional(),
    })).optional(),
    submitButton: z.object({
      id: z.string(),
      text: z.string(),
      action: z.string(),
      payload: z.any().optional(),
    }).optional(),
  }).optional(),
});

export type RichMessage = z.infer<typeof RichMessageSchema>;

// Home Screen UI Designer schemas
export const HomeScreenComponentSchema = z.object({
  id: z.string(),
  type: z.enum(['header', 'category_tabs', 'topic_grid', 'quick_actions', 'footer']),
  props: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    categories: z.array(z.string()).optional(),
    topics: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      icon: z.string(),
      message: z.string().optional(),
      category: z.string(),
      popular: z.boolean().optional(),
      actionType: z.enum(['message', 'survey', 'custom']).default('message'),
      surveyId: z.number().optional(), // Reference to survey ID for survey topics
    })).optional(),
    actions: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      action: z.string(),
      actionType: z.enum(['message', 'survey', 'custom']).default('message'),
      surveyId: z.number().optional(), // Reference to survey ID for survey actions
    })).optional(),
    style: z.object({
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
      layout: z.enum(['grid', 'list', 'carousel']).optional(),
      columns: z.number().optional(),
    }).optional(),
  }),
  order: z.number(),
  visible: z.boolean().default(true),
});

export const HomeScreenConfigSchema = z.object({
  version: z.string().default('1.0'),
  components: z.array(HomeScreenComponentSchema),
  theme: z.object({
    primaryColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    borderRadius: z.string().optional(),
  }).optional(),
  settings: z.object({
    enableSearch: z.boolean().default(false),
    enableCategories: z.boolean().default(true),
    defaultCategory: z.string().optional(),
  }).optional(),
});

export type HomeScreenComponent = z.infer<typeof HomeScreenComponentSchema>;
export type HomeScreenConfig = z.infer<typeof HomeScreenConfigSchema>;

// Survey Configuration schemas
export const SurveyQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  type: z.enum(['single_choice', 'multiple_choice', 'text', 'rating', 'conditional']),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    followUp: z.string().optional(), // Next question ID for conditional flow
    value: z.any().optional(),
  })).optional(),
  required: z.boolean().default(true),
  metadata: z.object({
    aiInstructions: z.string().optional(),
    validationRules: z.array(z.string()).optional(),
    skipLogic: z.object({
      condition: z.string(),
      skipTo: z.string(),
    }).optional(),
  }).optional(),
});

export const SurveyConfigSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  questions: z.array(SurveyQuestionSchema),
  conditionalFlow: z.boolean().default(false),
  completionMessage: z.string().optional(),
  aiInstructions: z.string().optional(),
  settings: z.object({
    allowBackNavigation: z.boolean().default(true),
    showProgress: z.boolean().default(true),
    savePartialResponses: z.boolean().default(true),
    timeoutMinutes: z.number().optional(),
  }).optional(),
});

export type SurveyQuestion = z.infer<typeof SurveyQuestionSchema>;
export type SurveyConfig = z.infer<typeof SurveyConfigSchema>;

export const messageSchema = z.object({
  id: z.number(),
  sessionId: z.string(),
  content: z.string(),
  sender: z.enum(["user", "bot"]),
  messageType: z.enum(["text", "card", "menu", "image", "quickReplies", "form"]).default("text"),
  createdAt: z.string(),
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    buttons: z.any().optional(),
    options: z.any().optional(),
    quickReplies: z.array(z.string()).optional(),
    formFields: z.array(z.object({
      id: z.string(),
      label: z.string(),
      type: z.enum(['text', 'email', 'textarea']),
      placeholder: z.string().optional(),
      required: z.boolean().optional(),
      value: z.string().optional(),
    })).optional(),
    submitButton: z.object({
      id: z.string(),
      text: z.string(),
      action: z.string(),
      payload: z.any().optional(),
    }).optional(),
    // Streaming support
    isStreaming: z.boolean().optional(),
    chunks: z.array(z.object({
      content: z.string(),
      messageType: z.string(),
      metadata: z.any().optional(),
      delay: z.number().optional(),
    })).optional(),
    // Follow-up message support
    isFollowUp: z.boolean().optional(),
  }).optional(),
});

export type MessageSchema = z.infer<typeof messageSchema>;