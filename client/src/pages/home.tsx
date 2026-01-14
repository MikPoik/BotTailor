import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, MessageSquare, Settings, Zap, Sparkles, Globe, Shield, Clock } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { ChatWidgetPortal } from "@/components/chat/ChatWidgetPortal";
import { useGlobalChatSession } from "@/hooks/use-global-chat-session";
import type { RouteDefinition } from "@shared/route-metadata";

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

export const route: RouteDefinition = {
  path: "/",
  ssr: true,
  metadata: {
    title: "BotTailor - Smart AI Chatbots Made Simple | Create Custom AI Assistants",
    description:
      "Create intelligent, customizable AI chatbots for your website in minutes. Deploy anywhere with our powerful AI platform. No coding required - start free today!",
    keywords:
      "AI chatbot, custom chatbot, website chatbot, AI assistant, chatbot builder, conversational AI, customer support bot, lead generation chatbot",
    ogTitle: "BotTailor - Smart AI Chatbots Made Simple",
    ogDescription:
      "Create intelligent, customizable AI chatbots for your website in minutes. Deploy anywhere with our powerful AI platform.",
    ogImage: "https://bottailor.com/og-image.jpg",
    canonical: "https://bottailor.com/",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "BotTailor",
      description: "Create intelligent, customizable AI chatbots for your website in minutes",
      url: "https://bottailor.com",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free tier available",
      },
      creator: {
        "@type": "Organization",
        name: "BotTailor",
        url: "https://bottailor.com",
      },
    },
  },
};

export default function Home() {
  const { sessionId: globalSessionId } = useGlobalChatSession();
  const { isAuthenticated } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Always fetch the site default chatbot for consistency
  const { data: defaultChatbot } = useQuery<ChatbotConfig>({
    queryKey: ['/api/public/default-chatbot'],
    enabled: isHydrated,
    retry: false,
  });

  useEffect(() => {
    // Set page title and meta description dynamically - only once
    if (document.title !== "BotTailor - Smart AI Chatbots Made Simple | Create Custom AI Assistants") {
      document.title = "BotTailor - Smart AI Chatbots Made Simple | Create Custom AI Assistants";

      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 'Create intelligent, customizable AI chatbots for your website in minutes. Deploy anywhere with our powerful AI platform. No coding required - start free today!');
      }
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Hero Section */}
      <section className="home-hero flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 md:py-24 relative" role="banner">
        <div className="home-hero-accent"></div>
        <div className="container max-w-6xl mx-auto text-center relative z-10">
          <header className="mb-8">
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-300"></div>
                <Bot className="h-24 w-24 text-primary relative drop-shadow-lg group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
                <Sparkles className="h-7 w-7 text-secondary absolute -top-2 -right-2 animate-pulse drop-shadow-lg" aria-hidden="true" />
              </div>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
              Smart AI Chatbots
            </h1>
            <p className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Made <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">Simple</span>
            </p>
          </header>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Create intelligent, customizable chatbots that understand your business. 
            Deploy anywhere in minutes with our powerful AI platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {isAuthenticated ? (
              <>
                <Button size="lg" asChild className="hero-button">
                  <a href="/dashboard">Go to Dashboard</a>
                </Button>

              </>
            ) : (
              <>
                <Button size="lg" asChild className="hero-button">
                  <a href="/handler/sign-in">Get Started Free</a>
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
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>Works anywhere</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section py-16 md:py-24 px-4 sm:px-6 lg:px-8" itemScope itemType="https://schema.org/ItemList">
        <div className="container max-w-6xl mx-auto">
          <header className="text-center mb-16">
            <div className="section-badge mb-4">
              Powerful Features
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl mb-4" itemProp="name">
              Everything you need for intelligent conversations
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto" itemProp="description">
              Build chatbots that actually understand your customers and provide real value
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mx-auto">
            <Card className="feature-card shadow-sm">
              <CardHeader>
                <div className="feature-icon-wrapper h-12 w-12 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-white" />
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

            <Card className="feature-card shadow-sm">
              <CardHeader>
                <div className="feature-icon-wrapper h-12 w-12 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-white" />
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

            <Card className="feature-card shadow-sm">
              <CardHeader>
                <div className="feature-icon-wrapper h-12 w-12 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-white" />
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

            <Card className="feature-card shadow-sm">
              <CardHeader>
                <div className="feature-icon-wrapper h-12 w-12 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-white" />
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

            <Card className="feature-card shadow-sm">
              <CardHeader>
                <div className="feature-icon-wrapper h-12 w-12 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-white" />
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

            <Card className="feature-card shadow-sm">
              <CardHeader>
                <div className="feature-icon-wrapper h-12 w-12 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-white" />
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
      <section id="demo" className="demo-section py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="section-badge mb-4">
            Try It Now
          </div>
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

      {/* FAQ Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8" itemScope itemType="https://schema.org/FAQPage">
        <div className="container max-w-4xl mx-auto">
          <header className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Get answers to common questions about BotTailor AI chatbots
            </p>
          </header>

          <div className="grid gap-6">
            <Card itemScope itemType="https://schema.org/Question">
              <CardHeader>
                <CardTitle itemProp="name">How quickly can I create a chatbot?</CardTitle>
              </CardHeader>
              <CardContent itemScope itemType="https://schema.org/Answer">
                <p itemProp="text" className="text-muted-foreground">
                  You can create and deploy a fully functional AI chatbot in under 5 minutes. Our intuitive setup wizard guides you through the entire process, from configuration to deployment.
                </p>
              </CardContent>
            </Card>

            <Card itemScope itemType="https://schema.org/Question">
              <CardHeader>
                <CardTitle itemProp="name">Do I need coding skills to use BotTailor?</CardTitle>
              </CardHeader>
              <CardContent itemScope itemType="https://schema.org/Answer">
                <p itemProp="text" className="text-muted-foreground">
                  No coding required! Our AI builder interface makes it easy for anyone to create professional chatbots. Advanced users can access additional configuration options.
                </p>
              </CardContent>
            </Card>

            <Card itemScope itemType="https://schema.org/Question">
              <CardHeader>
                <CardTitle itemProp="name">Can I customize the chatbot's appearance?</CardTitle>
              </CardHeader>
              <CardContent itemScope itemType="https://schema.org/Answer">
                <p itemProp="text" className="text-muted-foreground">
                  Absolutely! Customize colors, upload custom avatars, add background images, and match your brand perfectly. The chatbot adapts to your website's design seamlessly.
                </p>
              </CardContent>
            </Card>

            <Card itemScope itemType="https://schema.org/Question">
              <CardHeader>
                <CardTitle itemProp="name">What websites can I embed the chatbot on?</CardTitle>
              </CardHeader>
              <CardContent itemScope itemType="https://schema.org/Answer">
                <p itemProp="text" className="text-muted-foreground">
                  BotTailor works on any website - WordPress, Shopify, custom HTML sites, and more. Simply copy our one-line embed code and paste it into your website.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl mb-4 text-white">
            Ready to transform your customer support?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
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
                  <a href="/handler/sign-in">Start Building Free</a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="/contact">Contact Sales</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Chat Widget - Mounted in isolated Portal with separate QueryClient */}
      {isHydrated && (
        <ChatWidgetPortal chatbotConfig={defaultChatbot} />
      )}
    </div>
  );
}
