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
  guid: varchar("guid").notNull().unique().$defaultFn(() => uuidv4()), // Unique identifier for public URLs
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
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  sessionId: true,
  userId: true,
  chatbotConfigId: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  sessionId: true,
  content: true,
  sender: true,
  messageType: true,
  metadata: true,
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

// Rich message types
export const RichMessageSchema = z.object({
  type: z.enum(['text', 'card', 'menu', 'image', 'quickReplies','form']),
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
    })).optional(),
    actions: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      action: z.string(),
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

export const messageSchema = z.object({
  id: z.number(),
  sessionId: z.string(),
  content: z.string(),
  sender: z.enum(["user", "bot"]),
  messageType: z.enum(["text", "card", "menu", "image", "quickReplies","form"]).default("text"),
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