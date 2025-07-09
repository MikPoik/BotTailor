import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema, insertChatSessionSchema, RichMessageSchema } from "@shared/schema";
import { z } from "zod";
import { generateStructuredResponse, generateOptionResponse } from "./openai-service";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Request, Response } from "express";
import { ChatService } from "./storage";
import { fromZodError } from "zod-validation-error";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chatService = new ChatService();

export async function registerRoutes(app: Express): Promise<Server> {

  // Create or get chat session
  app.post("/api/chat/session", async (req, res) => {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      let session = await storage.getChatSession(sessionId);

      if (!session) {
        session = await storage.createChatSession({ sessionId });

        // Generate AI welcome message
        const welcomeResponse = await generateStructuredResponse(
          "User has just started a new chat session. Provide a friendly welcome message and ask how you can help them today.",
          sessionId,
          []
        );

        await storage.createMessage({
          sessionId,
          content: welcomeResponse.content,
          sender: "bot",
          messageType: welcomeResponse.messageType,
          metadata: welcomeResponse.metadata
        });
      }

      res.json({ session });
    } catch (error) {
      console.error("Error creating/getting session:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get messages for a session
  app.get("/api/chat/:sessionId/messages", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getRecentMessages(sessionId, 100);
      res.json({ messages });
    } catch (error) {
      console.error("Error getting messages:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Send a message
  app.post("/api/chat/:sessionId/messages", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messageData = insertMessageSchema.parse({
        ...req.body,
        sessionId,
        sender: "user"
      });

      const userMessage = await storage.createMessage(messageData);

      // Generate bot response based on message content
      const botResponse = await generateBotResponse(messageData.content, sessionId);
      const botMessage = await storage.createMessage(botResponse);

      res.json({ userMessage, botMessage });
    } catch (error) {
      console.error("Error sending message:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid message data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Handle option selection
  app.post("/api/chat/:sessionId/select-option", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { optionId, payload } = req.body;

      // Create user message for the selection
      await storage.createMessage({
        sessionId,
        content: getOptionDisplayText(optionId),
        sender: "user",
        messageType: "text",
      });

      // Generate bot response based on option selection
      const botResponse = await generateAIOptionResponse(optionId, payload, sessionId);
      const botMessage = await storage.createMessage(botResponse);

      res.json({ botMessage });
    } catch (error) {
      console.error("Error handling option selection:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Serve chat widget page for embedding
  app.get("/chat-widget", (req: Request, res: Response) => {
    const { sessionId, embedded, mobile } = req.query;

    const isMobile = mobile === 'true';
    const isEmbedded = embedded === 'true';

    // Serve minimal HTML for embedded widget
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Widget</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .chat-container {
            height: 100vh;
            display: flex;
            flex-direction: column;
            background: white;
        }
        .chat-header {
            background: #2563eb;
            color: white;
            padding: 1rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .chat-content {
            flex: 1;
            padding: 1rem;
            overflow-y: auto;
        }
        .message {
            margin: 0.5rem 0;
            padding: 0.75rem 1rem;
            border-radius: 0.75rem;
            max-width: 80%;
        }
        .message.user {
            background: #2563eb;
            color: white;
            margin-left: auto;
        }
        .message.assistant {
            background: #f3f4f6;
            color: #1f2937;
        }
        .input-container {
            padding: 1rem;
            border-top: 1px solid #e5e7eb;
            display: flex;
            gap: 0.5rem;
        }
        .input-container input {
            flex: 1;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            outline: none;
        }
        .input-container button {
            padding: 0.75rem 1.5rem;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
        }
        .input-container button:hover {
            background: #1d4ed8;
        }
        .typing {
            font-style: italic;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div id="chat-root"></div>

    <script type="text/babel">
        const { useState, useEffect, useRef } = React;

        function ChatWidget() {
            const [messages, setMessages] = useState([]);
            const [inputValue, setInputValue] = useState('');
            const [isTyping, setIsTyping] = useState(false);
            const messagesEndRef = useRef(null);

            const sessionId = "${sessionId}";
            const apiUrl = window.location.origin;

            useEffect(() => {
                loadMessages();
            }, []);

            useEffect(() => {
                scrollToBottom();
            }, [messages]);

            const scrollToBottom = () => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            };

            const loadMessages = async () => {
                try {
                    const response = await fetch(\`\${apiUrl}/api/chat/\${sessionId}\`);
                    const data = await response.json();
                    setMessages(data);
                } catch (error) {
                    console.error('Error loading messages:', error);
                }
            };

            const sendMessage = async (e) => {
                e.preventDefault();
                if (!inputValue.trim()) return;

                const userMessage = { role: 'user', content: inputValue };
                setMessages(prev => [...prev, userMessage]);
                setInputValue('');
                setIsTyping(true);

                try {
                    const response = await fetch(\`\${apiUrl}/api/chat/\${sessionId}\`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ message: inputValue }),
                    });

                    const data = await response.json();
                    setMessages(prev => [...prev, data]);
                } catch (error) {
                    console.error('Error sending message:', error);
                    setMessages(prev => [...prev, { 
                        role: 'assistant', 
                        content: 'Sorry, I encountered an error. Please try again.' 
                    }]);
                } finally {
                    setIsTyping(false);
                }
            };

            const closeChat = () => {
                if (window.parent !== window) {
                    window.parent.postMessage({ type: 'CLOSE_CHAT' }, '*');
                }
            };

            return (
                <div className="chat-container">
                    <div className="chat-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img 
                                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256"
                                alt="Support"
                                style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                            />
                            <div>
                                <h3 style={{ margin: 0, fontWeight: '600' }}>Support Assistant</h3>
                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                    <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', marginRight: '4px' }}></span>
                                    Online
                                </div>
                            </div>
                        </div>
                        ${isMobile ? `
                        <button onClick={closeChat} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem' }}>
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                        ` : `
                        <button onClick={closeChat} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem' }}>
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 13H5v-2h14v2z"/>
                            </svg>
                        </button>
                        `}
                    </div>

                    <div className="chat-content">
                        {messages.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '2rem' }}>
                                <p>👋 Hi! How can I help you today?</p>
                            </div>
                        ) : (
                            messages.map((message, index) => (
                                <div key={index} className={\`message \${message.role}\`}>
                                    {message.content}
                                </div>
                            ))
                        )}

                        {isTyping && (
                            <div className="message assistant typing">
                                Assistant is typing...
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={sendMessage} className="input-container">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your message..."
                            disabled={isTyping}
                        />
                        <button type="submit" disabled={isTyping}>
                            Send
                        </button>
                    </form>
                </div>
            );
        }

        ReactDOM.render(<ChatWidget />, document.getElementById('chat-root'));
    </script>
</body>
</html>`;

    res.send(html);
  });

  // Chat API routes
  app.get("/api/chat/:sessionId", async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId;
      const messages = await chatService.getMessages(sessionId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve messages" });
    }
  });

  app.post("/api/chat/:sessionId", async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const response = await chatService.sendMessage(sessionId, message);
      res.json(response);
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function getOptionDisplayText(optionId: string): string {
  const optionTexts: Record<string, string> = {
    billing: "I have a question about my billing",
    technical: "I need technical support",
    sales: "I have a sales inquiry",
    payment: "I have payment issues",
    subscription: "I want to change my subscription",
    invoice: "I need to download an invoice"
  };
  return optionTexts[optionId] || "Selected option";
}

async function generateBotResponse(userMessage: string, sessionId: string) {
  try {
    // Get conversation history for context
    const recentMessages = await storage.getRecentMessages(sessionId, 10);
    const conversationHistory = recentMessages
      .slice(-5) // Last 5 messages for context
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

    // Generate structured response using OpenAI
    const aiResponse = await generateStructuredResponse(userMessage, sessionId, conversationHistory);

    return {
      sessionId,
      content: aiResponse.content,
      sender: "bot" as const,
      messageType: aiResponse.messageType,
      metadata: aiResponse.metadata
    };
  } catch (error) {
    console.error("Error generating AI response:", error);

    // Fallback to simple response
    return {
      sessionId,
      content: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
      sender: "bot" as const,
      messageType: "text" as const,
      metadata: {
        quickReplies: ["Try again", "Contact support", "Main menu"]
      }
    };
  }
}

async function generateAIOptionResponse(optionId: string, payload: any, sessionId: string) {
  try {
    // Get conversation history for context
    const recentMessages = await storage.getRecentMessages(sessionId, 10);
    const conversationHistory = recentMessages
      .slice(-5) // Last 5 messages for context
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

    // Generate structured response using OpenAI
    const aiResponse = await generateOptionResponse(optionId, payload, sessionId, conversationHistory);

    return {
      sessionId,
      content: aiResponse.content,
      sender: "bot" as const,
      messageType: aiResponse.messageType,
      metadata: aiResponse.metadata
    };
  } catch (error) {
    console.error("Error generating AI option response:", error);

    // Fallback to simple response
    return {
      sessionId,
      content: "Thank you for your selection. How else can I assist you today?",
      sender: "bot" as const,
      messageType: "text" as const,
      metadata: {
        quickReplies: ["Start over", "Contact agent", "End chat"]
      }
    };
  }
}