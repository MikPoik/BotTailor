import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  userId: integer("user_id").references(() => users.id),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  sessionId: true,
  userId: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  sessionId: true,
  content: true,
  sender: true,
  messageType: true,
  metadata: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Rich message types
export const RichMessageSchema = z.object({
  type: z.enum(['text', 'card', 'menu', 'image', 'quickReplies']),
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
  }).optional(),
});

export type RichMessage = z.infer<typeof RichMessageSchema>;
