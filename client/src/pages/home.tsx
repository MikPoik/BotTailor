import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, MessageSquare, Settings, Zap, Sparkles, Globe, Shield, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import ChatWidget from "@/components/chat/chat-widget";

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
  homeScreenConfig?: {
    theme?: {
      primaryColor?: string;
      backgroundColor?: string;
      textColor?: string;
    };
  };
}

export default function Home() {
  const [sessionId, setSessionId] = useState<string>("");
  const { isAuthenticated } = useAuth();

  // Always fetch the site default chatbot for consistency
  const { data: defaultChatbot } = useQuery<ChatbotConfig>({
    queryKey: ['/api/public/default-chatbot'],
    enabled: true,
    retry: false,
  });

  useEffect(() => {
    const generateSessionId = () => {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const storedSessionId = localStorage.getItem('home_chat_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = generateSessionId();
      localStorage.setItem('home_chat_session_id', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 md:py-24">
        <div className="container max-w-6xl text-center">
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Bot className="h-20 w-20 text-primary" />
                <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl mb-6">
              Smart AI Chatbots
              <br />
              <span className="text-primary">Made Simple</span>
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Create intelligent, customizable chatbots that understand your business. 
            Deploy anywhere in minutes with our powerful AI platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {isAuthenticated ? (
              <>
                <Button size="lg" asChild>
                  <a href="/dashboard">Go to Dashboard</a>
                </Button>

              </>
            ) : (
              <>
                <Button size="lg" asChild>
                  <a href="/api/login">Get Started Free</a>
                </Button>

              </>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>5-minute setup</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Enterprise secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>Works anywhere</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-muted/30 px-4 sm:px-6 lg:px-8">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Powerful Features
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl mb-4">
              Everything you need for intelligent conversations
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Build chatbots that actually understand your customers and provide real value
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mx-auto">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">AI-Powered Intelligence</CardTitle>
                <CardDescription>
                  Leverage advanced language models for natural conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Built on cutting-edge AI technology that understands context, 
                  maintains conversation flow, and provides intelligent responses.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Rich Conversations</CardTitle>
                <CardDescription>
                  Interactive cards, menus, forms, and multimedia support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Go beyond simple text with interactive elements, surveys, 
                  appointment booking, and rich media for engaging experiences.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Deploy Anywhere</CardTitle>
                <CardDescription>
                  One-line embed code works on any website or platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Simple JavaScript snippet integrates seamlessly with any website. 
                  Responsive design works perfectly on desktop and mobile.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Easy Customization</CardTitle>
                <CardDescription>
                  Visual builder with no coding required
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Drag-and-drop interface to customize personality, appearance, 
                  and behavior. Advanced users can access full configuration.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Smart Website Integration</CardTitle>
                <CardDescription>
                  AI learns from your website content automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Upload documents or provide your website URL. The AI automatically 
                  learns your content to provide accurate, contextual answers.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Enterprise Ready</CardTitle>
                <CardDescription>
                  Secure, scalable, and reliable for business use
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Built with security and scale in mind. Analytics, conversation 
                  history, and admin controls for professional deployments.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="container max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-4">
            Try It Now
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl mb-4">
            Experience the difference
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Click the chat bubble below to start a conversation with our AI assistant. 
            See how natural and helpful AI-powered support can be.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 mx-auto">
            <Card className="text-left">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Natural Conversations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Ask questions, get help, or explore features. The AI understands 
                  context and maintains natural conversation flow.
                </p>
              </CardContent>
            </Card>

            <Card className="text-left">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Instant Responses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get immediate answers to your questions. No waiting, 
                  no phone queues, just instant intelligent assistance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary/5 px-4 sm:px-6 lg:px-8">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl mb-4">
            Ready to transform your customer support?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using AI chatbots to provide better customer experiences
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Button size="lg" asChild>
                <a href="/dashboard">Create Your Chatbot</a>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild>
                  <a href="/api/login">Start Building Free</a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="mailto:support@example.com">Contact Sales</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Chat Widget */}
      {sessionId && defaultChatbot && (
        <ChatWidget 
          sessionId={sessionId}
          position="bottom-right"
          primaryColor={defaultChatbot.homeScreenConfig?.theme?.primaryColor || "#3b82f6"}
          backgroundColor={defaultChatbot.homeScreenConfig?.theme?.backgroundColor || "#ffffff"}
          textColor={defaultChatbot.homeScreenConfig?.theme?.textColor || "#1f2937"}
          chatbotConfig={defaultChatbot}
        />
      )}
    </div>
  );
}