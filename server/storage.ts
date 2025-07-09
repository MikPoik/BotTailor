import { 
  users, 
  chatSessions, 
  messages,
  type User, 
  type InsertUser,
  type ChatSession,
  type InsertChatSession,
  type Message,
  type InsertMessage
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Chat session methods
  getChatSession(sessionId: string): Promise<ChatSession | undefined>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(sessionId: string, data: Partial<ChatSession>): Promise<ChatSession | undefined>;
  
  // Message methods
  getMessages(sessionId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getRecentMessages(sessionId: string, limit?: number): Promise<Message[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private chatSessions: Map<string, ChatSession>;
  private messages: Map<string, Message[]>;
  private currentUserId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.chatSessions = new Map();
    this.messages = new Map();
    this.currentUserId = 1;
    this.currentMessageId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getChatSession(sessionId: string): Promise<ChatSession | undefined> {
    return this.chatSessions.get(sessionId);
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const id = this.currentUserId++;
    const now = new Date();
    const session: ChatSession = {
      id,
      sessionId: insertSession.sessionId,
      userId: insertSession.userId || null,
      createdAt: now,
      updatedAt: now,
    };
    this.chatSessions.set(insertSession.sessionId, session);
    this.messages.set(insertSession.sessionId, []);
    return session;
  }

  async updateChatSession(sessionId: string, data: Partial<ChatSession>): Promise<ChatSession | undefined> {
    const session = this.chatSessions.get(sessionId);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...data, updatedAt: new Date() };
    this.chatSessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    return this.messages.get(sessionId) || [];
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      id,
      sessionId: insertMessage.sessionId,
      content: insertMessage.content,
      sender: insertMessage.sender,
      messageType: insertMessage.messageType || "text",
      metadata: insertMessage.metadata || null,
      createdAt: new Date(),
    };

    const sessionMessages = this.messages.get(insertMessage.sessionId) || [];
    sessionMessages.push(message);
    this.messages.set(insertMessage.sessionId, sessionMessages);

    return message;
  }

  async getRecentMessages(sessionId: string, limit: number = 50): Promise<Message[]> {
    const sessionMessages = this.messages.get(sessionId) || [];
    return sessionMessages.slice(-limit);
  }
}

export const storage = new MemStorage();

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
