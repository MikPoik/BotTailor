import { 
  users, 
  chatSessions, 
  messages,
  chatbotConfigs,
  type User, 
  type UpsertUser,
  type ChatSession,
  type InsertChatSession,
  type Message,
  type InsertMessage,
  type ChatbotConfig,
  type InsertChatbotConfig,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

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

  async getChatbotConfig(id: number): Promise<ChatbotConfig | null> {
    const results = await db.select().from(chatbotConfigs).where(eq(chatbotConfigs.id, id));
    return results[0] || null;
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