import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Bot,
  MessageSquare,
  Settings,
  ExternalLink,
} from "lucide-react";
import TabbedChatInterface from "@/components/chat/tabbed-chat-interface";

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
  createdAt: string;
  updatedAt: string;
}

export default function ChatbotTest() {
  const { id } = useParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [testSessionId, setTestSessionId] = useState<string>("");

  // Generate a unique test session ID
  useEffect(() => {
    const generateTestSessionId = () => {
      return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };
    setTestSessionId(generateTestSessionId());
  }, [id]);

  const { data: chatbot, isLoading: chatbotLoading } = useQuery<ChatbotConfig>({
    queryKey: [`/api/chatbots/${id}`],
    enabled: isAuthenticated && !!id,
    retry: false,
  });

  // Redirect to dashboard if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading || !isAuthenticated || chatbotLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!chatbot) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chatbot Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The chatbot you're looking for doesn't exist or you don't have
            permission to test it.
          </p>
          <Button asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const embedUrl = `${window.location.origin}/widget/${user?.id}/${chatbot.guid}`;
  const embedCode = `<script src="${window.location.origin}/embed.js"></script>
<script>
  ChatWidget.init({
    apiUrl: '${window.location.origin}',
    position: 'bottom-right',
    primaryColor: '#2563eb'
  });
</script>`;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Bot className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">
              Test Chatbot: {chatbot.name}
            </h1>
            <Badge variant={chatbot.isActive ? "default" : "secondary"}>
              {chatbot.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Test your chatbot's responses and behavior before embedding it on
            your website
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Chatbot Info and Embedding */}
          <div className="lg:col-span-1 space-y-6">
            {/* Chatbot Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="text-sm text-muted-foreground">
                    {chatbot.description || "No description"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Model</label>
                  <p className="text-sm text-muted-foreground">
                    {chatbot.model}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Temperature</label>
                  <p className="text-sm text-muted-foreground">
                    {chatbot.temperature / 10}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Max Tokens</label>
                  <p className="text-sm text-muted-foreground">
                    {chatbot.maxTokens}
                  </p>
                </div>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full"
                  >
                    <Link href={`/chatbots/${chatbot.id}`}>
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Configuration
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Embedding Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Embed on Your Site
                </CardTitle>
                <CardDescription>
                  Copy this code to add the chatbot to your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Widget URL</label>
                  <div className="mt-1 p-2 bg-muted rounded text-xs font-mono break-all">
                    {embedUrl}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Embed Code</label>
                  <div className="mt-1 p-2 bg-muted rounded text-xs font-mono">
                    <pre className="whitespace-pre-wrap break-all">
                      {embedCode}
                    </pre>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigator.clipboard.writeText(embedCode)}
                >
                  Copy Embed Code
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Live Test Chat
                </CardTitle>
                <CardDescription>
                  Interact with your chatbot to test its responses and behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="h-full pb-6">
                {testSessionId && (
                  <div className="h-full">
                    <TabbedChatInterface
                      sessionId={testSessionId}
                      isMobile={false}
                      isPreloaded={false}
                      onClose={() => {}} // No close needed for test interface
                      isEmbedded={false}
                      chatbotConfigId={chatbot.id}
                      chatbotConfig={chatbot}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
