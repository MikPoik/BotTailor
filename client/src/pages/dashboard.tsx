import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Plus, Settings, Palette, Globe, BarChart3 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import ChatWidget from "@/components/chat/chat-widget";

interface ChatbotConfig {
  id: number;
  name: string;
  description: string;
  model: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string>("");
  const [, setLocation] = useLocation();

  // Generate session ID for chat widget
  useEffect(() => {
    const generateSessionId = () => {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const storedSessionId = localStorage.getItem('dashboard_chat_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = generateSessionId();
      localStorage.setItem('dashboard_chat_session_id', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: chatbots, isLoading: chatbotsLoading } = useQuery<ChatbotConfig[]>({
    queryKey: ["/api/chatbots"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch conversation count for user's chatbots
  const { data: conversationCount = 0 } = useQuery<number>({
    queryKey: ["/api/chat/conversations/count"],
    enabled: isAuthenticated && !!chatbots?.length,
    retry: false,
  });

  // Get chatbot GUID from environment for consistency with homepage
  const envChatbotGuid = import.meta.env.VITE_DEFAULT_SITE_CHATBOT_GUID;

  // Fetch specific chatbot by GUID if configured
  const { data: specificChatbot } = useQuery<ChatbotConfig>({
    queryKey: [`/api/chatbots/guid/${envChatbotGuid}`],
    enabled: isAuthenticated && !!envChatbotGuid,
    retry: false,
  });

  // Get selected chatbot configuration (same logic as homepage)
  const getSelectedChatbot = () => {
    if (specificChatbot) {
      return specificChatbot;
    }
    // Fallback to first available from user's list
    if (!chatbots || chatbots.length === 0) return undefined;
    return chatbots.find(bot => bot.isActive) || chatbots[0];
  };

  const selectedChatbot = getSelectedChatbot();

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.firstName || user?.email}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your AI chatbots and view their performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chatbots</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chatbotsLoading ? "..." : chatbots?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {chatbots?.filter(bot => bot.isActive).length || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chatbotsLoading ? "..." : conversationCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Total conversations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Response</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.8s</div>
            <p className="text-xs text-muted-foreground">
              Response time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chatbots Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Your Chatbots</h2>
          <Button onClick={() => {
            console.log("Create Chatbot clicked");
            setLocation("/chatbots/new");
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Create Chatbot
          </Button>
        </div>

        {chatbotsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : chatbots && chatbots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chatbots.map((chatbot) => (
              <Card key={chatbot.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{chatbot.name}</CardTitle>
                    <Badge variant={chatbot.isActive ? "default" : "secondary"}>
                      {chatbot.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription>{chatbot.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>Model: {chatbot.model}</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/chatbots/${chatbot.guid}`}>
                        <Settings className="mr-2 h-3 w-3" />
                        Configure
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/chatbots/${chatbot.guid}/add-data`}>
                        <Globe className="mr-2 h-3 w-3" />
                        Add Data
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/chatbots/${chatbot.guid}/test`}>
                        <MessageSquare className="mr-2 h-3 w-3" />
                        Test
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/chatbots/${chatbot.guid}/ui-designer`}>
                        <Palette className="mr-2 h-3 w-3" />
                        UI Designer
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/chatbots/${chatbot.id}/surveys`}>
                        <BarChart3 className="mr-2 h-3 w-3" />
                        Survey Builder
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No chatbots yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first AI chatbot to get started
              </p>
              <Button asChild>
                <Link href="/chatbots/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Chatbot
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
              <CardDescription>
                Learn how to integrate and customize your chatbots
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <Link href="/docs">View Docs</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support</CardTitle>
              <CardDescription>
                Get help with your chatbot implementation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <Link href="/support">Contact Support</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chat Widget */}
      {sessionId && (
        <ChatWidget 
          sessionId={sessionId}
          position="bottom-right"
          primaryColor="#3b82f6"
          chatbotConfig={selectedChatbot}
        />
      )}
    </div>
  );
}