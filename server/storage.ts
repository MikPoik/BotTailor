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
  deleteChatSession(sessionId: string): Promise<void>;
  deleteAllChatSessions(chatbotConfigId: number): Promise<void>;

  // Message methods
  getMessages(sessionId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getRecentMessages(sessionId: string, limit?: number): Promise<Message[]>;

  // Chatbot config methods
  getChatbotConfigs(userId: string): Promise<ChatbotConfig[]>;
  getChatbotConfig(id: number): Promise<ChatbotConfig | undefined>;
  getChatbotConfigByGuid(userId: string, guid: string): Promise<ChatbotConfig | null>;
  createChatbotConfig(config: InsertChatbotConfig): Promise<ChatbotConfig>;
  updateChatbotConfig(id: number, data: Partial<ChatbotConfig>): Promise<ChatbotConfig | undefined>;
  deleteChatbotConfig(id: number): Promise<void>;

  // Website source methods
  getWebsiteSources(chatbotConfigId: number): Promise<WebsiteSource[]>;
  getWebsiteSource(id: number): Promise<WebsiteSource | undefined>;
  createWebsiteSource(source: InsertWebsiteSource): Promise<WebsiteSource>;
  updateWebsiteSource(id: number, data: Partial<WebsiteSource>): Promise<WebsiteSource | undefined>;
  deleteWebsiteSource(id: number): Promise<void>;

  // Website content methods
  getWebsiteContents(websiteSourceId: number): Promise<WebsiteContent[]>;
  createWebsiteContent(content: InsertWebsiteContent, embeddingArray: number[]): Promise<WebsiteContent>;
  searchSimilarContent(chatbotConfigId: number, query: string, limit?: number): Promise<WebsiteContent[]>;

  // Survey methods
  getSurveys(chatbotConfigId: number): Promise<Survey[]>;
  getSurvey(id: number): Promise<Survey | undefined>;
  createSurvey(surveyData: InsertSurvey): Promise<Survey>;
  updateSurvey(id: number, data: Partial<Survey>): Promise<Survey | undefined>;
  deleteSurvey(id: number): Promise<void>;

  // Survey session methods
  getSurveySession(surveyId: number, sessionId: string): Promise<SurveySession | undefined>;
  createSurveySession(sessionData: InsertSurveySession): Promise<SurveySession>;
  updateSurveySession(id: number, data: Partial<SurveySession>): Promise<SurveySession | undefined>;
  getSurveySessionBySessionId(sessionId: string): Promise<SurveySession | undefined>;

  // Active survey tracking methods
  setActiveSurvey(sessionId: string, surveyId: number | null): Promise<ChatSession | undefined>;
  getActiveSurveySession(sessionId: string): Promise<SurveySession | undefined>;
  deactivateAllSurveySessions(sessionId: string): Promise<void>;

  // Survey analytics methods
  getSurveyAnalyticsByChatbotGuid(chatbotGuid: string): Promise<{
    totalSurveys: number;
    totalResponses: number;
    completionRate: number;
    averageCompletionTime: number;
    surveyBreakdown: Array<{
      surveyId: number;
      surveyName: string;
      totalResponses: number;
      completedResponses: number;
      abandonedResponses: number;
      completionRate: number;
      avgCompletionTime: number;
      questionAnalytics: Array<{
        questionId: string;
        questionText: string;
        responses: any[];
        responseCount: number;
      }>;
    }>;
  }>;

  // Conversation count methods
  getConversationCount(userId: string): Promise<number>;

  // Subscription plan methods
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined>;

  // Subscription methods
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription | undefined>;
  updateSubscriptionByStripeId(stripeSubscriptionId: string, data: Partial<Subscription>): Promise<Subscription | undefined>;
  getUserSubscriptionWithPlan(userId: string): Promise<(Subscription & { plan: SubscriptionPlan }) | undefined>;
  incrementMessageUsage(userId: string): Promise<void>;
  resetMonthlyMessageUsage(userId: string): Promise<void>;
  checkBotLimit(userId: string): Promise<boolean>;
  checkMessageLimit(userId: string): Promise<boolean>;
  getOrCreateFreeSubscription(userId: string): Promise<Subscription & { plan: SubscriptionPlan }>;
}


export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Chat session methods
  async getChatSession(sessionId: string): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.sessionId, sessionId));
    return session || undefined;
  }

  async getChatSessionsByChatbotGuid(chatbotGuid: string, offset?: number, limit?: number): Promise<ChatSession[]> {
    const baseQuery = db
      .select({
        id: chatSessions.id,
        sessionId: chatSessions.sessionId,
        userId: chatSessions.userId,
        chatbotConfigId: chatSessions.chatbotConfigId,
        activeSurveyId: chatSessions.activeSurveyId,
        createdAt: chatSessions.createdAt,
        updatedAt: chatSessions.updatedAt,
      })
      .from(chatSessions)
      .innerJoin(chatbotConfigs, eq(chatSessions.chatbotConfigId, chatbotConfigs.id))
      .where(eq(chatbotConfigs.guid, chatbotGuid))
      .orderBy(desc(chatSessions.createdAt));

    if (offset !== undefined && limit !== undefined) {
      return await baseQuery.offset(offset).limit(limit);
    } else if (limit !== undefined) {
      return await baseQuery.limit(limit);
    } else {
      return await baseQuery;
    }
  }

  async getChatSessionsWithMultipleMessagesByChatbotGuid(chatbotGuid: string, offset?: number, limit?: number): Promise<ChatSession[]> {
    const baseQuery = db
      .select({
        id: chatSessions.id,
        sessionId: chatSessions.sessionId,
        userId: chatSessions.userId,
        chatbotConfigId: chatSessions.chatbotConfigId,
        activeSurveyId: chatSessions.activeSurveyId,
        createdAt: chatSessions.createdAt,
        updatedAt: chatSessions.updatedAt,
      })
      .from(chatSessions)
      .innerJoin(chatbotConfigs, eq(chatSessions.chatbotConfigId, chatbotConfigs.id))
      .where(
        and(
          eq(chatbotConfigs.guid, chatbotGuid),
          sql`EXISTS (
            SELECT 1 FROM messages m 
            WHERE m.session_id = ${chatSessions.sessionId} 
            GROUP BY m.session_id 
            HAVING COUNT(*) > 1
          )`
        )
      )
      .orderBy(desc(chatSessions.createdAt));

    if (offset !== undefined && limit !== undefined) {
      return await baseQuery.offset(offset).limit(limit);
    } else if (limit !== undefined) {
      return await baseQuery.limit(limit);
    } else {
      return await baseQuery;
    }
  }

  async createChatSession(sessionData: InsertChatSession): Promise<ChatSession> {
    const [session] = await db
      .insert(chatSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async updateChatSession(sessionId: string, data: Partial<ChatSession>): Promise<ChatSession | undefined> {
    const [session] = await db
      .update(chatSessions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(chatSessions.sessionId, sessionId))
      .returning();
    return session || undefined;
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    // First delete all messages for this session
    await db.delete(messages).where(eq(messages.sessionId, sessionId));

    // Delete all survey sessions for this chat session
    await db.delete(surveySessions).where(eq(surveySessions.sessionId, sessionId));

    // Finally delete the chat session
    await db.delete(chatSessions).where(eq(chatSessions.sessionId, sessionId));
  }

  async getChatSessionsCountByChatbotGuid(chatbotGuid: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatSessions)
      .innerJoin(chatbotConfigs, eq(chatSessions.chatbotConfigId, chatbotConfigs.id))
      .where(eq(chatbotConfigs.guid, chatbotGuid));
    return result[0]?.count || 0;
  }

  async getChatSessionsWithMultipleMessagesCountByChatbotGuid(chatbotGuid: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatSessions)
      .innerJoin(chatbotConfigs, eq(chatSessions.chatbotConfigId, chatbotConfigs.id))
      .where(
        and(
          eq(chatbotConfigs.guid, chatbotGuid),
          sql`EXISTS (
            SELECT 1 FROM messages m 
            WHERE m.session_id = ${chatSessions.sessionId} 
            GROUP BY m.session_id 
            HAVING COUNT(*) > 1
          )`
        )
      );
    return result[0]?.count || 0;
  }

  async deleteAllChatSessions(chatbotConfigId: number): Promise<void> {
    // Get all chat sessions for this chatbot
    const sessions = await db.select().from(chatSessions)
      .where(eq(chatSessions.chatbotConfigId, chatbotConfigId));

    // Delete all messages for these sessions
    for (const session of sessions) {
      await db.delete(messages).where(eq(messages.sessionId, session.sessionId));
    }

    // Delete all survey sessions for these chat sessions
    for (const session of sessions) {
      await db.delete(surveySessions).where(eq(surveySessions.sessionId, session.sessionId));
    }

    // Delete all chat sessions for this chatbot
    await db.delete(chatSessions).where(eq(chatSessions.chatbotConfigId, chatbotConfigId));
  }

  // Message methods
  async getMessages(sessionId: string): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.sessionId, sessionId));
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();
    return message;
  }

  async getRecentMessages(sessionId: string, limit: number = 50): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(asc(messages.createdAt)) // Order by creation time (oldest first)
      .limit(limit);
  }

  // Chatbot config methods
  async getChatbotConfigs(userId: string): Promise<ChatbotConfig[]> {
    return await db.select().from(chatbotConfigs).where(eq(chatbotConfigs.userId, userId));
  }

  async getChatbotConfig(id: number): Promise<ChatbotConfig | undefined> {
    const results = await db.select().from(chatbotConfigs).where(eq(chatbotConfigs.id, id));
    return results[0] || undefined;
  }

  async getChatbotConfigByGuidPublic(guid: string): Promise<ChatbotConfig | null> {
    const result = await db.select().from(chatbotConfigs).where(eq(chatbotConfigs.guid, guid)).limit(1);
    return result[0] || null;
  }

  async getChatbotConfigByGuid(userId: string, guid: string): Promise<ChatbotConfig | null> {
    const results = await db.select().from(chatbotConfigs)
      .where(and(eq(chatbotConfigs.userId, userId), eq(chatbotConfigs.guid, guid)));
    return results[0] || null;
  }

  async getPublicChatbotConfigByGuid(guid: string): Promise<ChatbotConfig | null> {
    const results = await db.select().from(chatbotConfigs)
      .where(eq(chatbotConfigs.guid, guid));
    return results[0] || null;
  }

  async createChatbotConfig(configData: InsertChatbotConfig): Promise<ChatbotConfig> {
    const [config] = await db
      .insert(chatbotConfigs)
      .values(configData)
      .returning();
    return config;
  }

  async updateChatbotConfig(id: number, data: Partial<ChatbotConfig>): Promise<ChatbotConfig | undefined> {
    const [config] = await db
      .update(chatbotConfigs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(chatbotConfigs.id, id))
      .returning();
    return config || undefined;
  }

  async deleteChatbotConfig(id: number): Promise<void> {
    // First, get all chat sessions for this chatbot
    const sessions = await db.select().from(chatSessions)
      .where(eq(chatSessions.chatbotConfigId, id));

    // Delete all messages for these sessions
    for (const session of sessions) {
      await db.delete(messages).where(eq(messages.sessionId, session.sessionId));
    }

    // Delete all survey sessions for these chat sessions
    for (const session of sessions) {
      await db.delete(surveySessions).where(eq(surveySessions.sessionId, session.sessionId));
    }

    // Delete all chat sessions for this chatbot
    await db.delete(chatSessions).where(eq(chatSessions.chatbotConfigId, id));

    // Delete all surveys for this chatbot
    const surveysList = await db.select().from(surveys)
      .where(eq(surveys.chatbotConfigId, id));

    for (const survey of surveysList) {
      // Survey sessions are already deleted above, so just delete the surveys
      await db.delete(surveys).where(eq(surveys.id, survey.id));
    }

    // Delete all website sources and their content for this chatbot
    const sources = await db.select().from(websiteSources)
      .where(eq(websiteSources.chatbotConfigId, id));

    for (const source of sources) {
      // Delete website content first
      await db.delete(websiteContent).where(eq(websiteContent.websiteSourceId, source.id));
      // Then delete the source
      await db.delete(websiteSources).where(eq(websiteSources.id, source.id));
    }

    // Finally, delete the chatbot config
    await db.delete(chatbotConfigs).where(eq(chatbotConfigs.id, id));
  }

  // Website source methods
  async getWebsiteSources(chatbotConfigId: number): Promise<WebsiteSource[]> {
    return await db.select().from(websiteSources)
      .where(eq(websiteSources.chatbotConfigId, chatbotConfigId))
      .orderBy(asc(websiteSources.createdAt));
  }

  async getWebsiteSource(id: number): Promise<WebsiteSource | undefined> {
    const [source] = await db.select().from(websiteSources).where(eq(websiteSources.id, id));
    return source || undefined;
  }

  async createWebsiteSource(sourceData: InsertWebsiteSource): Promise<WebsiteSource> {
    const [source] = await db
      .insert(websiteSources)
      .values(sourceData)
      .returning();
    return source;
  }

  async updateWebsiteSource(id: number, data: Partial<WebsiteSource>): Promise<WebsiteSource | undefined> {
    const [source] = await db
      .update(websiteSources)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(websiteSources.id, id))
      .returning();
    return source || undefined;
  }

  async deleteWebsiteSource(id: number): Promise<void> {
    // First delete all website content for this source
    await db.delete(websiteContent).where(eq(websiteContent.websiteSourceId, id));
    // Then delete the source
    await db.delete(websiteSources).where(eq(websiteSources.id, id));
  }

  // Website content methods
  async getWebsiteContents(websiteSourceId: number): Promise<WebsiteContent[]> {
    return await db.select().from(websiteContent)
      .where(eq(websiteContent.websiteSourceId, websiteSourceId))
      .orderBy(asc(websiteContent.createdAt));
  }

  async createWebsiteContent(contentData: InsertWebsiteContent, embeddingArray: number[]): Promise<WebsiteContent> {
    const [content] = await db
      .insert(websiteContent)
      .values({
        ...contentData,
        embedding: sql`${`[${embeddingArray.join(',')}]`}::vector`
      })
      .returning();
    return content;
  }

  async searchSimilarContent(chatbotConfigId: number, query: string, limit: number = 3): Promise<WebsiteContent[]> {
    // Get all website sources for this chatbot
    const sources = await db.select().from(websiteSources)
      .where(and(
        eq(websiteSources.chatbotConfigId, chatbotConfigId),
        eq(websiteSources.status, 'completed')
      ));

    if (sources.length === 0) return [];

    const sourceIds = sources.map(s => s.id);

    // Generate embedding for the query using OpenAI
    let queryEmbedding: number[];
    try {
      const { WebsiteScanner } = await import('./website-scanner');
      const scanner = new WebsiteScanner();
      queryEmbedding = await scanner.generateEmbedding(query);
    } catch (error) {
      console.error('Error generating query embedding:', error);
      return [];
    }

    // Convert embedding to PostgreSQL vector format
    const queryVector = `[${queryEmbedding.join(',')}]`;

    // Use pgvector cosine distance for similarity search across all sources
    const sourceConditions = sourceIds.map(id => eq(websiteContent.websiteSourceId, id));
    const whereCondition = sourceConditions.length === 1
      ? sourceConditions[0]
      : or(...sourceConditions);

    // Execute vector similarity search using pgvector
    const results = await db.execute(sql`
      SELECT id, website_source_id, url, title, content, content_type, word_count, created_at,
             (embedding <=> ${queryVector}::vector) as distance
      FROM website_content
      WHERE ${whereCondition}
      AND embedding IS NOT NULL
      ORDER BY embedding <=> ${queryVector}::vector
      LIMIT ${limit}
    `);

    const mappedResults = results.rows.map(row => ({
      id: row.id as number,
      websiteSourceId: row.website_source_id as number,
      url: row.url as string,
      title: row.title as string | null,
      content: row.content as string,
      contentType: row.content_type as string | null,
      wordCount: row.word_count as number | null,
      embedding: null, // Don't return the embedding in search results
      createdAt: row.created_at as Date,
    }));

    // Simple deduplication based on content
    const deduplicatedResults: typeof mappedResults = [];
    const seenContent = new Set<string>();

    for (const result of mappedResults) {
      // Use first 300 characters as a simple duplicate check
      const contentKey = result.content.substring(0, 300).toLowerCase().trim();

      if (!seenContent.has(contentKey)) {
        seenContent.add(contentKey);
        deduplicatedResults.push(result);
      }

      // Stop when we have enough unique results
      if (deduplicatedResults.length >= limit) {
        break;
      }
    }

    return deduplicatedResults;
  }

  // Survey methods
  async getSurveys(chatbotConfigId: number): Promise<Survey[]> {
    return await db.select().from(surveys)
      .where(eq(surveys.chatbotConfigId, chatbotConfigId))
      .orderBy(asc(surveys.createdAt));
  }

  async getSurvey(id: number): Promise<Survey | undefined> {
    const [survey] = await db.select().from(surveys).where(eq(surveys.id, id));
    return survey || undefined;
  }

  async createSurvey(surveyData: InsertSurvey): Promise<Survey> {
    const [survey] = await db
      .insert(surveys)
      .values(surveyData)
      .returning();
    return survey;
  }

  async updateSurvey(id: number, data: Partial<Survey>): Promise<Survey | undefined> {
    const [survey] = await db
      .update(surveys)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(surveys.id, id))
      .returning();
    return survey || undefined;
  }

  async deleteSurvey(id: number): Promise<void> {
    // First delete all survey sessions for this survey
    await db.delete(surveySessions).where(eq(surveySessions.surveyId, id));
    // Then delete the survey
    await db.delete(surveys).where(eq(surveys.id, id));
  }

  // Survey session methods
  async getSurveySession(surveyId: number, sessionId: string): Promise<SurveySession | undefined> {
    const [session] = await db.select().from(surveySessions)
      .where(and(eq(surveySessions.surveyId, surveyId), eq(surveySessions.sessionId, sessionId)));
    return session || undefined;
  }

  async createSurveySession(sessionData: InsertSurveySession): Promise<SurveySession> {
    const [session] = await db
      .insert(surveySessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async updateSurveySession(id: number, data: Partial<SurveySession>): Promise<SurveySession | undefined> {
    const [session] = await db
      .update(surveySessions)
      .set(data)
      .where(eq(surveySessions.id, id))
      .returning();
    return session || undefined;
  }

  async getSurveySessionBySessionId(sessionId: string): Promise<SurveySession | undefined> {
    const [session] = await db.select().from(surveySessions)
      .where(eq(surveySessions.sessionId, sessionId));
    return session || undefined;
  }

  // Active survey tracking methods
  async setActiveSurvey(sessionId: string, surveyId: number | null): Promise<ChatSession | undefined> {
    const [session] = await db
      .update(chatSessions)
      .set({ activeSurveyId: surveyId, updatedAt: new Date() })
      .where(eq(chatSessions.sessionId, sessionId))
      .returning();
    return session || undefined;
  }

  async getActiveSurveySession(sessionId: string): Promise<SurveySession | undefined> {
    // First get the chat session to find the active survey ID
    const chatSession = await this.getChatSession(sessionId);
    if (!chatSession || !chatSession.activeSurveyId) {
      return undefined;
    }

    // Then get the specific survey session for that survey
    return await this.getSurveySession(chatSession.activeSurveyId, sessionId);
  }

  async deactivateAllSurveySessions(sessionId: string): Promise<void> {
    // Mark all survey sessions for this chat session as inactive
    await db
      .update(surveySessions)
      .set({ status: 'inactive' })
      .where(and(
        eq(surveySessions.sessionId, sessionId),
        eq(surveySessions.status, 'active')
      ));

    console.log(`[SURVEY] Deactivated all active survey sessions for session: ${sessionId}`);
  }

  // Conversation count method
  async getConversationCount(userId: string): Promise<number> {
    console.log(`[CONVERSATION_COUNT] Getting count for user: ${userId}`);

    // Count unique sessions that are connected to this user's chatbots
    const result = await db
      .select({ count: sql<number>`count(distinct ${chatSessions.sessionId})` })
      .from(chatSessions)
      .innerJoin(chatbotConfigs, eq(chatSessions.chatbotConfigId, chatbotConfigs.id))
      .where(eq(chatbotConfigs.userId, userId));

    console.log(`[CONVERSATION_COUNT] Query result:`, result);
    console.log(`[CONVERSATION_COUNT] Count for user ${userId}:`, result[0]?.count || 0);

    return result[0]?.count || 0;
  }

  // Subscription plan methods
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(asc(subscriptionPlans.price));
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan || undefined;
  }

  async createSubscriptionPlan(planData: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [plan] = await db
      .insert(subscriptionPlans)
      .values(planData)
      .returning();
    return plan;
  }

  async updateSubscriptionPlan(id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .update(subscriptionPlans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return plan || undefined;
  }

  // Subscription methods
  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return subscription || undefined;
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .limit(1);
    return subscription || undefined;
  }

  async createSubscription(subscriptionData: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(subscriptionData)
      .returning();
    return subscription;
  }

  async updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription || undefined;
  }

  async updateSubscriptionByStripeId(stripeSubscriptionId: string, data: Partial<Subscription>): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .returning();
    return subscription || undefined;
  }

  async getUserSubscriptionWithPlan(userId: string): Promise<(Subscription & { plan: SubscriptionPlan }) | undefined> {
    const result = await db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        planId: subscriptions.planId,
        stripeSubscriptionId: subscriptions.stripeSubscriptionId,
        stripeCustomerId: subscriptions.stripeCustomerId,
        status: subscriptions.status,
        cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd, // Add missing field!
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        messagesUsedThisMonth: subscriptions.messagesUsedThisMonth,
        createdAt: subscriptions.createdAt,
        updatedAt: subscriptions.updatedAt,
        plan: subscriptionPlans,
      })
      .from(subscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    return result[0] || undefined;
  }

  async incrementMessageUsage(userId: string): Promise<void> {
    await db
      .update(subscriptions)
      .set({
        messagesUsedThisMonth: sql`${subscriptions.messagesUsedThisMonth} + 1`,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.userId, userId));
  }

  async resetMonthlyMessageUsage(userId: string): Promise<void> {
    await db
      .update(subscriptions)
      .set({
        messagesUsedThisMonth: 0,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.userId, userId));
  }

  async getOrCreateFreeSubscription(userId: string): Promise<Subscription & { plan: SubscriptionPlan }> {
    // First check if user already has a subscription
    const existing = await this.getUserSubscriptionWithPlan(userId);
    if (existing) {
      return existing;
    }

    // Get the free plan
    const freePlan = await db.select().from(subscriptionPlans)
      .where(eq(subscriptionPlans.name, 'Free'))
      .limit(1);

    if (!freePlan || freePlan.length === 0) {
      throw new Error('Free subscription plan not found');
    }

    // Create free subscription for user
    const subscription = await this.createSubscription({
      userId,
      planId: freePlan[0].id,
      status: 'active',
      messagesUsedThisMonth: 0
    });

    return {
      ...subscription,
      plan: freePlan[0]
    };
  }

  async checkBotLimit(userId: string): Promise<boolean> {
    // Admin user exclusion - bypass all bot limits
    const adminUserId = process.env.DEFAULT_SITE_ADMIN_USER_ID;
    if (adminUserId && userId === adminUserId) {
      return true; // Unlimited bots for admin user
    }

    // Get user's current subscription with plan, or create free subscription
    let subscription = await this.getUserSubscriptionWithPlan(userId);

    if (!subscription) {
      // Auto-assign free subscription for new users
      subscription = await this.getOrCreateFreeSubscription(userId);
    }

    // Count current bots
    const currentBots = await this.getChatbotConfigs(userId);

    // Check if under limit (-1 means unlimited)
    if (subscription.plan.maxBots === -1) {
      return true;
    }

    return currentBots.length < subscription.plan.maxBots;
  }

  async checkMessageLimit(userId: string): Promise<boolean> {
    // Admin user exclusion - bypass all message limits
    const adminUserId = process.env.DEFAULT_SITE_ADMIN_USER_ID;
    if (adminUserId && userId === adminUserId) {
      return true; // Unlimited messages for admin user
    }

    // Get user's current subscription with plan, or create free subscription
    let subscription = await this.getUserSubscriptionWithPlan(userId);

    if (!subscription) {
      // Auto-assign free subscription for new users
      subscription = await this.getOrCreateFreeSubscription(userId);
    }

    // Check if under limit (-1 means unlimited)
    if (subscription.plan.maxMessagesPerMonth === -1) {
      return true;
    }

    const messagesUsed = subscription.messagesUsedThisMonth || 0;
    return messagesUsed < subscription.plan.maxMessagesPerMonth;
  }

  // Survey analytics implementation
  async getSurveyAnalyticsByChatbotGuid(chatbotGuid: string): Promise<{
    totalSurveys: number;
    totalResponses: number;
    completionRate: number;
    averageCompletionTime: number;
    surveyBreakdown: Array<{
      surveyId: number;
      surveyName: string;
      totalResponses: number;
      completedResponses: number;
      abandonedResponses: number;
      completionRate: number;
      avgCompletionTime: number;
      questionAnalytics: Array<{
        questionId: string;
        questionText: string;
        responses: any[];
        responseCount: number;
      }>;
    }>;
  }> {
    // Get chatbot config to find the ID
    const chatbot = await db.select().from(chatbotConfigs).where(eq(chatbotConfigs.guid, chatbotGuid)).limit(1);
    if (!chatbot[0]) {
      return {
        totalSurveys: 0,
        totalResponses: 0,
        completionRate: 0,
        averageCompletionTime: 0,
        surveyBreakdown: [],
      };
    }

    const chatbotConfigId = chatbot[0].id;

    // Get all surveys for this chatbot
    const allSurveys = await db.select().from(surveys).where(eq(surveys.chatbotConfigId, chatbotConfigId));
    
    if (allSurveys.length === 0) {
      return {
        totalSurveys: 0,
        totalResponses: 0,
        completionRate: 0,
        averageCompletionTime: 0,
        surveyBreakdown: [],
      };
    }

    let totalResponses = 0;
    let totalCompleted = 0;
    let totalCompletionTimeMs = 0;
    let completedWithTime = 0;

    const surveyBreakdown = await Promise.all(
      allSurveys.map(async (survey) => {
        // Get all survey sessions for this survey
        const sessions = await db.select().from(surveySessions).where(eq(surveySessions.surveyId, survey.id));
        
        const totalResponses = sessions.length;
        // Consider sessions as completed if they have responses for most questions or are marked inactive/completed
        const completedResponses = sessions.filter(s => {
          if (s.status === 'completed') return true;
          if (s.status === 'inactive' && s.responses) {
            // Count as completed if they answered most questions
            const responseCount = Object.keys(s.responses as any || {}).length;
            const surveyConfig = survey.surveyConfig as any;
            const totalQuestions = surveyConfig?.questions?.length || 0;
            return responseCount >= Math.ceil(totalQuestions * 0.5); // 50% completion threshold
          }
          return false;
        }).length;
        const abandonedResponses = sessions.filter(s => s.status === 'abandoned').length;
        const completionRate = totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0;
        
        // Calculate average completion time for completed/inactive sessions with responses
        const completedSessions = sessions.filter(s => {
          if (s.status === 'completed' && s.completedAt && s.startedAt) return true;
          if (s.status === 'inactive' && s.startedAt) {
            // Use updatedAt as completion time for inactive sessions
            const responseCount = Object.keys(s.responses as any || {}).length;
            return responseCount > 0;
          }
          return false;
        });
        let avgCompletionTime = 0;
        if (completedSessions.length > 0) {
          const totalTime = completedSessions.reduce((sum, session) => {
            const endTime = session.completedAt ? new Date(session.completedAt).getTime() : new Date(session.updatedAt).getTime();
            const completionTime = endTime - new Date(session.startedAt).getTime();
            return sum + completionTime;
          }, 0);
          avgCompletionTime = totalTime / completedSessions.length;
          totalCompletionTimeMs += totalTime;
          completedWithTime += completedSessions.length;
        }

        // Analyze questions and responses
        const surveyConfig = survey.surveyConfig as any;
        const questions = surveyConfig?.questions || [];
        
        const questionAnalytics = questions.map((question: any, index: number) => {
          const questionResponses = sessions
            .map(session => {
              const responses = session.responses as any;
              // Try multiple possible question ID formats
              const possibleIds = [
                question.id,                    // q_1, q_2, etc.
                `q${index}`,                   // q0, q1, q2, etc.
                `question_${index}`,           // question_0, question_1, etc.
                `q_${index + 1}`,             // q_1, q_2, etc. (1-indexed)
              ];
              
              for (const id of possibleIds) {
                const response = responses?.[id];
                if (response !== undefined && response !== null) {
                  // Handle different response formats
                  if (typeof response === 'object') {
                    if (response.rating !== undefined) {
                      return response.rating;
                    } else if (response.selected_options) {
                      return response.selected_options;
                    } else if (response.selection_count) {
                      return response.selected_options || response;
                    }
                    return response;
                  }
                  return response;
                }
              }
              return null;
            })
            .filter(response => response !== null && response !== undefined);

          return {
            questionId: question.id,
            questionText: question.text,
            responses: questionResponses,
            responseCount: questionResponses.length,
          };
        });

        return {
          surveyId: survey.id,
          surveyName: survey.name,
          totalResponses,
          completedResponses,
          abandonedResponses,
          completionRate,
          avgCompletionTime,
          questionAnalytics,
        };
      })
    );

    // Calculate overall statistics
    totalResponses = surveyBreakdown.reduce((sum, survey) => sum + survey.totalResponses, 0);
    totalCompleted = surveyBreakdown.reduce((sum, survey) => sum + survey.completedResponses, 0);
    const overallCompletionRate = totalResponses > 0 ? (totalCompleted / totalResponses) * 100 : 0;
    const averageCompletionTime = completedWithTime > 0 ? totalCompletionTimeMs / completedWithTime : 0;

    return {
      totalSurveys: allSurveys.length,
      totalResponses,
      completionRate: overallCompletionRate,
      averageCompletionTime,
      surveyBreakdown,
    };
  }

}

export const storage = new DatabaseStorage();

export class ChatService {
  constructor() {
  }

  async getMessages(sessionId: string): Promise<any[]> {
    const messages = await storage.getMessages(sessionId);
    return messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
  }

  async sendMessage(sessionId: string, message: string): Promise<any> {
    // Create user message
    await storage.createMessage({
      sessionId,
      content: message,
      sender: 'user',
      messageType: 'text',
      metadata: {}
    });

    // Generate bot response
    const botResponse = {
      role: 'assistant',
      content: `I received your message: "${message}". How can I help you further?`
    };

    // Store bot response
    await storage.createMessage({
      sessionId,
      content: botResponse.content,
      sender: 'bot',
      messageType: 'text',
      metadata: {}
    });

    return botResponse;
  }
}