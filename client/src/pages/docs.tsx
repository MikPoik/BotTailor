
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bot, MessageSquare, Settings, Globe, Palette, BarChart3, Code, ExternalLink, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import ChatWidget from "@/components/chat/chat-widget";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalChatSession } from "@/hooks/use-global-chat-session";
import type { RouteDefinition } from "@shared/route-metadata";

export default function Docs() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  // Use unified global chat session
  const { sessionId } = useGlobalChatSession();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Fetch the site default chatbot for chat widget
  const { data: defaultChatbot } = useQuery<{
    id: number;
    isActive: boolean;
    homeScreenConfig?: {
      theme?: {
        primaryColor?: string;
        backgroundColor?: string;
        textColor?: string;
      };
    };
    [key: string]: any;
  }>({
    queryKey: ['/api/public/default-chatbot'],
    enabled: isHydrated,
    retry: false,
  });

  useEffect(() => {
    // Set page title and meta description for SEO
    document.title = "Documentation - BotTailor | Complete Guide to AI Chatbot Creation";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Complete guide to creating, customizing, and deploying AI chatbots with BotTailor. Learn embedding, configuration, and best practices.');
    }
  }, []);

  const copyToClipboard = (text: string, codeId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(codeId);
    setTimeout(() => setCopiedCode(null), 2000);
  };



  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Bot className="h-8 w-8 text-primary" aria-hidden="true" />
          <h1 className="text-3xl font-bold tracking-tight">BotTailor Documentation</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Complete guide to creating, customizing, and deploying AI chatbots with our platform
        </p>
      </header>

      {/* Quick Start */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Quick Start</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <CardTitle className="text-lg">Create Chatbot</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Start by creating your first AI chatbot with our intuitive setup wizard.
              </p>
              {isAuthenticated ? (
                <Button size="sm" asChild>
                  <Link href="/chatbots/new">Create Chatbot</Link>
                </Button>
              ) : (
                <Button size="sm" asChild>
                  <a href="/handler/sign-in">Sign In to Create</a>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <CardTitle className="text-lg">Customize & Train</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Add your content, customize the appearance, and train your chatbot.
              </p>
              {isAuthenticated ? (
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <Button size="sm" variant="outline" asChild>
                  <a href="/handler/sign-in">Sign In to Access</a>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <CardTitle className="text-lg">Deploy</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Embed your chatbot on any website with a simple code snippet.
              </p>

            </CardContent>
          </Card>
        </div>
      </section>

      {/* Core Features */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Core Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Chatbot Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium">AI Configuration</h4>
                <p className="text-sm text-muted-foreground">Configure model, temperature, tokens, and system prompts</p>
              </div>
              <div>
                <h4 className="font-medium">Welcome & Fallback Messages</h4>
                <p className="text-sm text-muted-foreground">Customize greeting and error handling messages</p>
              </div>
              <div>
                <h4 className="font-medium">Active/Inactive States</h4>
                <p className="text-sm text-muted-foreground">Control when your chatbot is available to users</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Data Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium">Website Scanning</h4>
                <p className="text-sm text-muted-foreground">Automatically learn from your website content</p>
              </div>
              <div>
                <h4 className="font-medium">File Uploads</h4>
                <p className="text-sm text-muted-foreground">Upload documents, PDFs, and text files</p>
              </div>
              <div>
                <h4 className="font-medium">Manual Text</h4>
                <p className="text-sm text-muted-foreground">Add custom knowledge directly</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                UI Customization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium">Color Themes</h4>
                <p className="text-sm text-muted-foreground">Customize primary, background, and text colors</p>
              </div>
              <div>
                <h4 className="font-medium">Background Images</h4>
                <p className="text-sm text-muted-foreground">Add custom background images to chat interface</p>
              </div>
              <div>
                <h4 className="font-medium">Avatar Upload</h4>
                <p className="text-sm text-muted-foreground">Use custom avatars for your chatbot</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Analytics & Surveys
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium">Conversation Analytics</h4>
                <p className="text-sm text-muted-foreground">Track chat sessions and user interactions</p>
              </div>
              <div>
                <h4 className="font-medium">Survey Builder</h4>
                <p className="text-sm text-muted-foreground">Create interactive forms and surveys</p>
              </div>
              <div>
                <h4 className="font-medium">Form Integration</h4>
                <p className="text-sm text-muted-foreground">Collect user information with email notifications</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Embedding Guide */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Embedding Your Chatbot</h2>


          <Card>
            <CardHeader>
              <CardTitle>Testing Your Widget</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Use our built-in testing tools to preview how your chatbot will appear on external websites.
              </p>
              <div className="space-y-2">
              </div>
            </CardContent>
          </Card>

      </section>

      {/* AI Configuration */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">AI Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Temperature</h4>
                <p className="text-sm text-muted-foreground">
                  Controls creativity (0.0 = focused, 1.0 = creative). Recommended: 0.3-0.7
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Max Tokens</h4>
                <p className="text-sm text-muted-foreground">
                  Maximum response length. Higher values allow longer responses but cost more.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">System Prompt</h4>
                <p className="text-sm text-muted-foreground">
                  Define your chatbot's personality, role, and behavior guidelines.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Best Practices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">System Prompt Tips</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Be specific about the chatbot's role</li>
                  <li>• Include guidelines for handling sensitive topics</li>
                  <li>• Specify response style and tone</li>
                  <li>• Mention available actions (forms, surveys)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Content Guidelines</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Keep knowledge base content up-to-date</li>
                  <li>• Use clear, structured data</li>
                  <li>• Test with common user questions</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Interactive Features */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Interactive Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rich Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Text with formatting</li>
                <li>• Images and media</li>
                <li>• Action buttons</li>
                <li>• Quick reply options</li>
                <li>• Interactive cards</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Forms & Surveys</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Contact forms</li>
                <li>• Lead generation</li>
                <li>• Feedback collection</li>
                <li>• Appointment booking</li>
                <li>• Custom surveys</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Menu Options</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Category browsing</li>
                <li>• Quick actions</li>
                <li>• Live agent requests</li>
                <li>• FAQ shortcuts</li>
                <li>• Service navigation</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Troubleshooting</h2>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Common Issues</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Widget Not Appearing</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Check that the chatbot is set to "Active"</li>
                  <li>• Verify the correct chatbot GUID in embed code</li>
                  <li>• Ensure no CSS conflicts with z-index</li>
                  <li>• Check browser console for JavaScript errors</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Styling Issues</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Use UI Designer to set colors properly</li>
                  <li>• Check CSS specificity conflicts</li>
                  <li>• Test on different devices and browsers</li>
                  <li>• Verify color codes are valid hex values</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Performance Issues</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Optimize knowledge base content size</li>
                  <li>• Reduce max tokens if responses are slow</li>
                  <li>• Check internet connectivity</li>
                  <li>• Monitor API rate limits</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Support */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Need Help?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Get Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/contact">Contact Support</Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Our support team is here to help with setup, configuration, and troubleshooting.
              </p>
            </CardContent>
          </Card>

        </div>
      </section>

      {/* Chat Widget */}
      {isHydrated && sessionId && defaultChatbot && defaultChatbot.isActive && (
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

export const route: RouteDefinition = {
  path: "/docs",
  ssr: true,
  metadata: {
    title: "Documentation - BotTailor | Complete Guide to AI Chatbot Creation",
    description:
      "Complete guide to creating, customizing, and deploying AI chatbots with BotTailor. Learn embedding, configuration, and best practices.",
    keywords:
      "chatbot documentation, AI chatbot guide, BotTailor docs, chatbot setup, embedding guide",
    ogTitle: "Documentation - BotTailor",
    ogDescription:
      "Complete guide to creating, customizing, and deploying AI chatbots with BotTailor.",
    ogImage: "https://bottailor.com/og-docs.jpg",
    canonical: "https://bottailor.com/docs",
  },
};
