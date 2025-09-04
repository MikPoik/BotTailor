import { 
  users, 
  chatSessions, 
  messages,
  chatbotConfigs,
  websiteSources,
  websiteContent,
  surveys,
  surveySessions,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, sql, asc, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Chat session methods
  getChatSession(sessionId: string): Promise<ChatSession | undefined>;
  getChatSessionsByChatbotGuid(chatbotGuid: string): Promise<ChatSession[]>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(sessionId: string, data: Partial<ChatSession>): Promise<ChatSession | undefined>;

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

  // Conversation count methods
  getConversationCount(userId: string): Promise<number>;
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

  async getChatSessionsByChatbotGuid(chatbotGuid: string): Promise<ChatSession[]> {
    return await db
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