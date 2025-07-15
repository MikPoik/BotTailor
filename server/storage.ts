import { 
  users, 
  chatSessions, 
  messages,
  chatbotConfigs,
  websiteSources,
  websiteContent,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { asc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Chat session methods
  getChatSession(sessionId: string): Promise<ChatSession | undefined>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(sessionId: string, data: Partial<ChatSession>): Promise<ChatSession | undefined>;

  // Message methods
  getMessages(sessionId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getRecentMessages(sessionId: string, limit?: number): Promise<Message[]>;

  // Chatbot config methods
  getChatbotConfigs(userId: string): Promise<ChatbotConfig[]>;
  getChatbotConfig(id: number): Promise<ChatbotConfig | undefined>;
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
  createWebsiteContent(content: InsertWebsiteContent, embedding: string): Promise<WebsiteContent>;
  searchSimilarContent(chatbotConfigId: number, query: string, limit?: number): Promise<WebsiteContent[]>;
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

  async createWebsiteContent(contentData: InsertWebsiteContent, embedding: string): Promise<WebsiteContent> {
    const [content] = await db
      .insert(websiteContent)
      .values({ ...contentData, embedding })
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
    
    // For now, do text-based search on content
    // In production, this would use vector similarity with embeddings
    const queryLower = query.toLowerCase();
    
    // Get content from all sources and filter by relevance
    const allContent = await db.select().from(websiteContent)
      .where(
        sourceIds.length === 1 
          ? eq(websiteContent.websiteSourceId, sourceIds[0])
          : eq(websiteContent.websiteSourceId, sourceIds[0]) // For now, search first source
      );

    // Simple text matching scoring
    const scoredContent = allContent
      .map(content => {
        const contentLower = content.content.toLowerCase();
        const titleLower = (content.title || '').toLowerCase();
        
        let score = 0;
        const queryWords = queryLower.split(/\s+/);
        
        for (const word of queryWords) {
          if (word.length > 2) { // Ignore very short words
            if (titleLower.includes(word)) score += 3;
            if (contentLower.includes(word)) score += 1;
          }
        }
        
        return { ...content, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scoredContent.map(({ score, ...content }) => content);
  }
}

export const storage = new DatabaseStorage();

export class ChatService {
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
      messageType: 'text'
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
      messageType: 'text'
    });

    return botResponse;
  }
}