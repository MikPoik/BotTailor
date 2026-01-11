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
  name: text("name").notNull(),
  description: text("description"),
  avatarUrl: varchar("avatar_url"),
  systemPrompt: text("system_prompt").notNull(),
  model: text("model").notNull().default("gpt-5.1"),
  temperature: integer("temperature").default(7), // 0-10 scale (will divide by 10)
  maxTokens: integer("max_tokens").default(1000),
  isActive: boolean("is_active").default(true),
  welcomeMessage: text("welcome_message"),
  fallbackMessage: text("fallback_message"),
  homeScreenConfig: jsonb("home_screen_config"), // Dynamic UI configuration
  initialMessages: jsonb("initial_messages"), // Initial message bubbles for embed widget
  backgroundImageUrl: varchar("background_image_url"), // Background image for home screen
  // Email configuration for form submissions
  formRecipientEmail: varchar("form_recipient_email"), // Where form submissions are sent
  formRecipientName: varchar("form_recipient_name"), // Name of the recipient
  senderEmail: varchar("sender_email"), // From email address for notifications
  senderName: varchar("sender_name"), // From name for notifications
  formConfirmationMessage: text("form_confirmation_message"), // Custom message shown after form submission
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  chatbotConfigId: integer("chatbot_config_id").references(() => chatbotConfigs.id),
  activeSurveyId: integer("active_survey_id").references(() => surveys.id), // Track currently active survey
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => chatSessions.sessionId),
  content: text("content").notNull(),
  sender: text("sender").notNull(), // 'user' | 'bot'
  messageType: text("message_type").notNull().default("text"), // 'text' | 'card' | 'menu' | 'image' | 'form_submission'
  metadata: jsonb("metadata"), // For rich content data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Content Sources table for storing website URLs, text content, and metadata
export const websiteSources = pgTable("website_sources", {
  id: serial("id").primaryKey(),
  chatbotConfigId: integer("chatbot_config_id").notNull().references(() => chatbotConfigs.id),
  sourceType: text("source_type").notNull().default("website"), // 'website' | 'text' | 'file'
  url: varchar("url", { length: 2048 }), // Optional for text sources
  title: text("title"),
  description: text("description"),
  textContent: text("text_content"), // For text/file sources
  fileName: text("file_name"), // Original filename for file sources
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
  surveyId: integer("survey_id").notNull().references(() => surveys.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull().references(() => chatSessions.sessionId),
  userId: varchar("user_id").references(() => users.id),
  currentQuestionIndex: integer("current_question_index").default(0),
  responses: jsonb("responses").default({}), // Stores all user responses
  status: text("status").notNull().default("active"), // 'active' | 'completed' | 'abandoned'
  completionHandled: boolean("completion_handled").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Subscription Plans table for defining available subscription tiers
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 'Basic', 'Premium', 'Ultra'
  description: text("description"),
  stripePriceId: varchar("stripe_price_id").notNull().unique(),
  stripeProductId: varchar("stripe_product_id").notNull(),
  price: integer("price").notNull(), // Price in cents
  currency: varchar("currency", { length: 3 }).notNull().default("usd"),
  billingInterval: text("billing_interval").notNull().default("month"), // 'month' | 'year'
  maxBots: integer("max_bots").notNull(),
  maxMessagesPerMonth: integer("max_messages_per_month").notNull(),
  features: jsonb("features"), // Array of feature descriptions
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User Subscriptions table for tracking user subscription status
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  stripeSubscriptionId: varchar("stripe_subscription_id").unique(),
  stripeCustomerId: varchar("stripe_customer_id"),
  status: text("status").notNull().default("active"), // 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing'
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false), // Track if subscription is canceled but still active
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  messagesUsedThisMonth: integer("messages_used_this_month").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Embed Designs table for managing iframe embedding variants
export const embedDesigns = pgTable("embed_designs", {
  id: serial("id").primaryKey(),
  chatbotConfigId: integer("chatbot_config_id").notNull().references(() => chatbotConfigs.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  embedId: varchar("embed_id").notNull().unique().$defaultFn(() => uuidv4()), // Public-facing ID for embed URLs
  
  // Basic info
  name: varchar("name"),
  description: text("description"),
  designType: varchar("design_type").notNull().default("minimal"), // 'minimal', 'compact', 'full'
  
  // Theme customization
  primaryColor: varchar("primary_color").default("#2563eb"),
  backgroundColor: varchar("background_color").default("#ffffff"),
  textColor: varchar("text_color").default("#1f2937"),
  
  // UI customization
  welcomeMessage: text("welcome_message"),
  welcomeType: varchar("welcome_type").default("text"), // 'text', 'form', 'buttons'
  inputPlaceholder: varchar("input_placeholder").default("Type your message..."),
  showAvatar: boolean("show_avatar").default(true),
  showTimestamp: boolean("show_timestamp").default(false),
  headerText: varchar("header_text"),
  footerText: text("footer_text"),
  
  // CTA configuration (NEW)
  ctaConfig: jsonb("cta_config"), // CTA view configuration
  
  // Advanced options
  hideBranding: boolean("hide_branding").default(false),
  customCss: text("custom_css"),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Embed Design Components table to control which UI elements are shown
export const embedDesignComponents = pgTable("embed_design_components", {
  id: serial("id").primaryKey(),
  embedDesignId: integer("embed_design_id").notNull().references(() => embedDesigns.id, { onDelete: "cascade" }),
  
  componentName: varchar("component_name").notNull(), // 'welcome_section', 'chat_messages', 'input_field', etc.
  isVisible: boolean("is_visible").default(true),
  componentOrder: integer("component_order").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User upsert schema for Neon Auth
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
  isActive: true,
  welcomeMessage: true,
  fallbackMessage: true,
  homeScreenConfig: true,
  initialMessages: true,
  backgroundImageUrl: true,
  formRecipientEmail: true,
  formRecipientName: true,
  senderEmail: true,
  senderName: true,
  formConfirmationMessage: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  sessionId: true,
  userId: true,
  chatbotConfigId: true,
  activeSurveyId: true,
});

export const insertMessageSchema = z.object({
  sessionId: z.string(),
  content: z.string(),
  sender: z.enum(["user", "bot", "assistant"]),
  messageType: z.enum(["text", "image", "audio", "video", "file", "card", "menu", "multiselect_menu", "rating", "quickReplies", "form", "form_submission", "system"]).default("text"),
  metadata: z.record(z.any()).default({}),
});

// Content sources schemas
export const insertWebsiteSourceSchema = createInsertSchema(websiteSources).pick({
  chatbotConfigId: true,
  sourceType: true,
  url: true,
  title: true,
  description: true,
  textContent: true,
  fileName: true,
  sitemapUrl: true,
  maxPages: true,
}).extend({
  // Make url optional for text sources
  url: z.string().url().optional(),
  // Add validation for sourceType
  sourceType: z.enum(["website", "text", "file"]).default("website"),
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

// Content source types
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

// Subscription schemas
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).pick({
  name: true,
  description: true,
  stripePriceId: true,
  stripeProductId: true,
  price: true,
  currency: true,
  billingInterval: true,
  maxBots: true,
  maxMessagesPerMonth: true,
  features: true,
  isActive: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  userId: true,
  planId: true,
  stripeSubscriptionId: true,
  stripeCustomerId: true,
  status: true,
  currentPeriodStart: true,
  currentPeriodEnd: true,
  messagesUsedThisMonth: true,
});

// Subscription types
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

// Rich message types
export const RichMessageSchema = z.object({
  type: z.enum(['text', 'card', 'menu', 'multiselect_menu', 'rating', 'image', 'quickReplies', 'form']),
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
    quickReplies: z.array(z.union([
      z.string(),
      z.object({
        text: z.string(),
        action: z.string().optional(),
      }),
    ])).optional(),
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
      icon: z.string().optional(),
      action: z.string(),
      payload: z.any().optional(),
    }).optional(),
    // Rating specific metadata
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    step: z.number().optional(),
    ratingType: z.enum(['stars', 'numbers', 'scale']).optional(),
    // Multiselect specific metadata
    allowMultiple: z.boolean().optional(),
    minSelections: z.number().optional(),
    maxSelections: z.number().optional(),
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
    })).optional().default([]), // Ensure topics is always an array
    titleFontSize: z.string().optional(),
    descriptionFontSize: z.string().optional(),
    actions: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      icon: z.string().optional(),
      action: z.string(),
      actionType: z.enum(['message', 'survey', 'custom']).default('message'),
      surveyId: z.number().optional(), // Reference to survey ID for survey actions
      itemStyle: z.enum(['filled', 'outlined']).optional(), // Override for individual action styling
    })).optional(),
    style: z.object({
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
      layout: z.enum(['grid', 'list', 'carousel']).optional(),
      columns: z.number().optional(),
      itemStyle: z.enum(['filled', 'outlined']).optional().default('filled'),
      transparentBackground: z.boolean().optional(),
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
    backgroundImageUrl: z.string().optional(),
    backgroundImageTransparency: z.number().optional(),
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
  allowFreeChoice: z.boolean().default(false), // Enable "Other" option with inline text input
  metadata: z.object({
    aiInstructions: z.string().optional(),
    validationRules: z.array(z.string()).optional(),
    skipLogic: z.object({
      condition: z.string(),
      skipTo: z.string(),
    }).optional(),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    ratingType: z.enum(['stars', 'numbers', 'scale']).optional(),
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
  messageType: z.enum(["text", "card", "menu", "multiselect_menu", "rating", "image", "quickReplies", "form", "form_submission"]).default("text"),
  createdAt: z.string(),
  metadata: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    buttons: z.any().optional(),
    options: z.any().optional(),
    quickReplies: z.array(z.union([
      z.string(),
      z.object({
        text: z.string(),
        action: z.string().optional(),
      }),
    ])).optional(),
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
      icon: z.string().optional(),
      action: z.string(),
      payload: z.any().optional(),
    }).optional(),
    // Rating specific metadata
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    step: z.number().optional(),
    ratingType: z.enum(['stars', 'numbers', 'scale']).optional(),
    // Multiselect specific metadata
    allowMultiple: z.boolean().optional(),
    minSelections: z.number().optional(),
    maxSelections: z.number().optional(),
    selectedOptions: z.array(z.string()).optional(),
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
// ============================================
// CTA Configuration Schemas (NEW)
// ============================================

// Extended styling system for rich CTA design
// Supports comprehensive CSS properties for AI layout generation
export const ComponentStyleSchema = z.object({
  // ========== COLORS & OPACITY ==========
  // Theme color overrides - allows per-component customization
  backgroundColor: z.string().optional(),
  color: z.string().optional(), // Text color (alias for textColor)
  textColor: z.string().optional(), // Explicit text color
  borderColor: z.string().optional(),
  opacity: z.number().min(0).max(1).optional(),
  
  // ========== BORDERS ==========
  borderWidth: z.number().optional(),
  borderRadius: z.number().optional(),
  borderStyle: z.enum(['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset']).optional(),
  border: z.string().optional(), // Shorthand: "1px solid #ccc"
  
  // ========== SHADOWS & EFFECTS ==========
  boxShadow: z.string().optional(),
  textShadow: z.string().optional(),
  filter: z.string().optional(), // blur, brightness, contrast, etc.
  
  // ========== SPACING ==========
  padding: z.number().optional(),
  paddingTop: z.number().optional(),
  paddingRight: z.number().optional(),
  paddingBottom: z.number().optional(),
  paddingLeft: z.number().optional(),
  margin: z.number().optional(),
  marginTop: z.number().optional(),
  marginRight: z.number().optional(),
  marginBottom: z.number().optional(),
  marginLeft: z.number().optional(),
  gap: z.number().optional(),
  
  // ========== TYPOGRAPHY ==========
  fontSize: z.number().optional(),
  fontWeight: z.number().optional(),
  fontStyle: z.enum(['normal', 'italic', 'oblique']).optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  textDecoration: z.enum(['none', 'underline', 'overline', 'line-through']).optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  wordBreak: z.enum(['normal', 'break-all', 'keep-all', 'break-word']).optional(),
  whiteSpace: z.enum(['normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line']).optional(),
  
  // ========== SIZING ==========
  width: z.string().optional(),
  height: z.string().optional(),
  minWidth: z.string().optional(),
  minHeight: z.string().optional(),
  maxWidth: z.string().optional(),
  maxHeight: z.string().optional(),
  aspectRatio: z.string().optional(),
  
  // ========== DISPLAY & FLEX ==========
  display: z.enum(['block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid', 'none']).optional(),
  flexDirection: z.enum(['row', 'row-reverse', 'column', 'column-reverse']).optional(),
  flexWrap: z.enum(['wrap', 'nowrap', 'wrap-reverse']).optional(),
  flexGrow: z.number().optional(),
  flexShrink: z.number().optional(),
  flexBasis: z.string().optional(),
  flex: z.string().optional(), // Shorthand: "1 1 auto"
  alignItems: z.enum(['flex-start', 'flex-end', 'center', 'stretch', 'baseline']).optional(),
  alignContent: z.enum(['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly', 'stretch']).optional(),
  justifyContent: z.enum(['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly']).optional(),
  alignSelf: z.enum(['auto', 'flex-start', 'flex-end', 'center', 'stretch', 'baseline']).optional(),
  
  // ========== GRID ==========
  gridTemplateColumns: z.string().optional(),
  gridTemplateRows: z.string().optional(),
  gridAutoFlow: z.enum(['row', 'column', 'dense']).optional(),
  gridAutoColumns: z.string().optional(),
  gridAutoRows: z.string().optional(),
  gridGap: z.number().optional(),
  gridColumnGap: z.number().optional(),
  gridRowGap: z.number().optional(),
  gridColumn: z.string().optional(),
  gridRow: z.string().optional(),
  
  // ========== POSITIONING ==========
  position: z.enum(['static', 'relative', 'absolute', 'fixed', 'sticky']).optional(),
  top: z.string().optional(),
  right: z.string().optional(),
  bottom: z.string().optional(),
  left: z.string().optional(),
  zIndex: z.number().optional(),
  
  // ========== OVERFLOW ==========
  overflow: z.enum(['visible', 'hidden', 'scroll', 'auto']).optional(),
  overflowX: z.enum(['visible', 'hidden', 'scroll', 'auto']).optional(),
  overflowY: z.enum(['visible', 'hidden', 'scroll', 'auto']).optional(),
  
  // ========== TRANSFORMS ==========
  transform: z.string().optional(),
  transformOrigin: z.string().optional(),
  
  // ========== TRANSITIONS & ANIMATIONS ==========
  transition: z.string().optional(),
  cursor: z.enum(['auto', 'pointer', 'default', 'text', 'wait', 'help', 'move', 'not-allowed', 'grab', 'grabbing']).optional(),
  
  // ========== BACKGROUND ==========
  backgroundSize: z.enum(['auto', 'cover', 'contain']).optional(),
  backgroundPosition: z.string().optional(),
  backgroundRepeat: z.enum(['repeat', 'no-repeat', 'repeat-x', 'repeat-y']).optional(),
  backgroundAttachment: z.enum(['scroll', 'fixed', 'local']).optional(),
  
  // ========== GRADIENTS & EFFECTS ==========
  gradient: z.object({
    enabled: z.boolean(),
    type: z.enum(['linear', 'radial']).optional(),
    angle: z.number().optional(), // 0-360 for linear
    startColor: z.string().optional(),
    endColor: z.string().optional(),
  }).optional(),
}).strict();

export const CTAButtonSchema = z.object({
  id: z.string(),
  text: z.string(),
  variant: z.enum(['solid', 'outline', 'ghost']).default('solid'),
  action: z.enum(['message', 'link', 'custom']).default('message'),
  predefinedMessage: z.string().optional(), // Message sent when action is 'message'
  url: z.string().optional(), // URL when action is 'link'
  actionLabel: z.string().optional(),
  style: ComponentStyleSchema.optional(), // Extended styling
});

export const CTAComponentSchema = z.object({
  id: z.string(),
  type: z.enum(['header', 'description', 'form', 'button_group', 'feature_list', 'badge', 'divider', 'container', 'richtext', 'custom_html']),
  order: z.number(),
  visible: z.boolean().default(true),
  style: ComponentStyleSchema.optional(), // Component-level styling
  props: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    backgroundImageUrl: z.string().optional(),
    
    // Feature list
    features: z.array(z.object({
      icon: z.string().optional(),
      title: z.string(),
      description: z.string(),
      style: ComponentStyleSchema.optional(),
    })).optional(),
    
    // Button group
    buttons: z.array(CTAButtonSchema).optional(),
    
    // Badge component
    icon: z.string().optional(),
    badgeStyle: z.enum(['circle', 'rounded', 'square']).optional(),
    
    // Divider component
    dividerStyle: z.enum(['solid', 'dashed', 'dotted']).optional(),
    dividerColor: z.string().optional(),
    
    // Container component (layout wrapper)
    layout: z.enum(['column', 'row', 'grid']).optional(),
    columns: z.number().optional(),
    
    // RichText component
    htmlContent: z.string().optional(),
  }).optional(),
});

export const CTAThemeSchema = z.object({
  primaryColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  accentColor: z.string().optional(),
});

export const CTASettingsSchema = z.object({
  autoShowAfterSeconds: z.number().optional(),
  dismissible: z.boolean().default(true),
  showOncePerSession: z.boolean().default(false),
});

export const CTAGenerationSchema = z.object({
  prompt: z.string(),
  model: z.string(),
  timestamp: z.date(),
});

export const CTAConfigSchema = z.object({
  version: z.string().default('1.0'),
  enabled: z.boolean().default(false),
  
  // Layout
  layout: z.object({
    style: z.enum(['banner', 'card', 'modal', 'sidebar']).default('card'),
    position: z.enum(['top', 'center', 'bottom']).default('center'),
    width: z.enum(['full', 'wide', 'narrow']).default('wide'),
    componentGap: z.number().min(0).max(100).optional(), // Gap between components in pixels
    backgroundImage: z.string().optional(), // S3 URL for background image
    backgroundPattern: z.enum(['none', 'dots', 'grid', 'waves', 'stripes']).optional(), // CSS pattern
    backgroundOverlay: z.object({
      enabled: z.boolean(),
      color: z.string().optional(),
      opacity: z.number().min(0).max(1).optional(),
    }).optional(),
  }).optional(),
  
  // Components (similar to homeScreenConfig)
  components: z.array(CTAComponentSchema).default([]),
  
  // CTA Button Configuration (DEPRECATED - use button_group component instead)
  // Kept for backward compatibility
  primaryButton: CTAButtonSchema.optional(),
  secondaryButton: z.object({
    id: z.string(),
    text: z.string(),
    action: z.enum(['close', 'link', 'none']),
    url: z.string().optional(),
  }).optional(),
  
  // Theming
  theme: CTAThemeSchema.optional(),
  
  // AI Generation tracking
  generatedBy: CTAGenerationSchema.optional(),
  
  // Settings
  settings: CTASettingsSchema.optional(),
});

export type CTAButton = z.infer<typeof CTAButtonSchema>;
export type CTAComponent = z.infer<typeof CTAComponentSchema>;
export type CTATheme = z.infer<typeof CTAThemeSchema>;
export type CTASettings = z.infer<typeof CTASettingsSchema>;
export type CTAGeneration = z.infer<typeof CTAGenerationSchema>;
export type CTAConfig = z.infer<typeof CTAConfigSchema>;
export type ComponentStyle = z.infer<typeof ComponentStyleSchema>;