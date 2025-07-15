import ChatWidget from "@/components/chat/chat-widget";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface ChatbotConfig {
  id: number;
  guid: string;
  name: string;
  description: string;
  model: string;
  isActive: boolean;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  welcomeMessage: string;
  fallbackMessage: string;
  avatarUrl?: string;
}

export default function Home() {
  const [sessionId, setSessionId] = useState<string>("");
  const { isAuthenticated } = useAuth();

  // Fetch available chatbot configs
  const { data: chatbots } = useQuery<ChatbotConfig[]>({
    queryKey: ["/api/chatbots"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Select the first active chatbot config or fallback to default
  const selectedChatbot = chatbots?.find(bot => bot.isActive) || chatbots?.[0];

  useEffect(() => {
    // Generate or get session ID
    const generateSessionId = () => {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const storedSessionId = localStorage.getItem('chat_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = generateSessionId();
      localStorage.setItem('chat_session_id', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  if (!sessionId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main content area */}
      <main className="container max-w-4xl py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Welcome to ChatBot Builder
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Test your chat widget experience below. The chat bubble should appear in the bottom-right corner.
          </p>
        </div>
        
        {/* Demo content */}
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Interactive Chat</h3>
              <p className="text-muted-foreground">
                Click the chat bubble in the bottom-right corner to start a conversation 
                with our AI assistant.
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Rich Responses</h3>
              <p className="text-muted-foreground">
                Experience rich message types including cards, menus, and quick replies 
                in the chat interface.
              </p>
            </div>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Responsive Design</h3>
            <p className="text-muted-foreground">
              The chat widget adapts to different screen sizes and can be embedded 
              on any website with a simple JavaScript snippet.
            </p>
          </div>
        </div>
      </main>

      {/* Chat Widget */}
      <ChatWidget 
        sessionId={sessionId}
        position="bottom-right"
        primaryColor="#3b82f6"
        chatbotConfig={selectedChatbot}
      />
    </div>
  );
}