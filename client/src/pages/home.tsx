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

  // Fetch available chatbot configs (authenticated users only)
  const { data: chatbots } = useQuery<ChatbotConfig[]>({
    queryKey: ["/api/chatbots"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Get chatbot GUID from URL parameters or environment
  const urlParams = new URLSearchParams(window.location.search);
  const urlChatbotGuid = urlParams.get('chatbot');
  const envChatbotGuid = import.meta.env.VITE_DEFAULT_SITE_CHATBOT_GUID;
  const targetChatbotGuid = urlChatbotGuid || envChatbotGuid;

  // Fetch specific chatbot by GUID if configured (authenticated users)
  const { data: specificChatbot } = useQuery<ChatbotConfig>({
    queryKey: [`/api/chatbots/${targetChatbotGuid}`],
    enabled: isAuthenticated && !!targetChatbotGuid,
    retry: false,
  });

  // Fetch public chatbot by GUID (for non-authenticated users or public access)
  const { data: publicChatbot } = useQuery<ChatbotConfig>({
    queryKey: [`/api/public/chatbots/${targetChatbotGuid}`],
    enabled: !isAuthenticated && !!targetChatbotGuid,
    retry: false,
  });

  // Fetch site default chatbot for non-authenticated users when no specific GUID is provided
  const { data: defaultChatbot } = useQuery<ChatbotConfig>({
    queryKey: ['/api/public/default-chatbot'],
    enabled: !isAuthenticated && !targetChatbotGuid,
    retry: false,
  });

  // Get selected chatbot configuration
  const getSelectedChatbot = () => {
    if (isAuthenticated) {
      // Authenticated user flow
      if (specificChatbot) {
        return specificChatbot;
      }
      // Fallback to first available from user's list
      if (!chatbots || chatbots.length === 0) return undefined;
      return chatbots.find(bot => bot.isActive) || chatbots[0];
    } else {
      // Non-authenticated user flow
      if (publicChatbot) {
        return publicChatbot;
      }
      if (defaultChatbot) {
        return defaultChatbot;
      }
      return undefined;
    }
  };

  const selectedChatbot = getSelectedChatbot();

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

          {selectedChatbot && (
            <div className="p-6 border rounded-lg bg-muted/50">
              <h3 className="text-lg font-semibold mb-2">Active Chatbot Configuration</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {selectedChatbot.name}</p>
                <p><span className="font-medium">Model:</span> {selectedChatbot.model}</p>
                <p><span className="font-medium">GUID:</span> <code className="bg-background px-1 py-0.5 rounded text-xs">{selectedChatbot.guid}</code></p>
                {selectedChatbot.description && (
                  <p><span className="font-medium">Description:</span> {selectedChatbot.description}</p>
                )}
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {isAuthenticated ? (
                  <>
                    Configure site-wide default with environment variables:
                    <br />
                    <code>DEFAULT_SITE_CHATBOT_GUID={selectedChatbot.guid}</code>
                    <br />
                    <code>DEFAULT_SITE_ADMIN_USER_ID=your_user_id</code>
                    <br />
                    Or use URL parameter: <code>?chatbot={selectedChatbot.guid}</code>
                  </>
                ) : (
                  <>
                    This is the {publicChatbot ? 'configured' : 'default'} chatbot for this site.
                    <br />
                    Site owner can configure default with environment variables:
                    <br />
                    <code>DEFAULT_SITE_CHATBOT_GUID={selectedChatbot.guid}</code>
                    <br />
                    <code>DEFAULT_SITE_ADMIN_USER_ID=your_user_id</code>
                  </>
                )}
              </div>
            </div>
          )}
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