
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link, useParams } from "wouter";
import { useEffect, useState } from "react";
import { ArrowLeft, Copy, ExternalLink, Code, Globe, Palette, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ChatbotConfig {
  id: number;
  guid: string;
  name: string;
  description: string;
  model: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export default function ChatbotEmbed() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const guid = params.guid;

  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [customDomain, setCustomDomain] = useState('');
  const [widgetKey, setWidgetKey] = useState<number>(0);

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

  const { data: chatbot, isLoading: chatbotLoading } = useQuery<ChatbotConfig>({
    queryKey: [`/api/chatbots/${guid}`],
    enabled: isAuthenticated && !!guid,
    retry: false,
  });

  // Load and initialize chat widget for testing - moved before early returns
  useEffect(() => {
    if (!chatbot || !user || isLoading || !isAuthenticated || chatbotLoading) return;

    // Clean up any existing widgets using the reset method
    const cleanupExistingWidget = () => {
      if ((window as any).ChatWidget && (window as any).ChatWidget.reset) {
        // Use the built-in reset method
        (window as any).ChatWidget.reset();
      } else {
        // Fallback manual cleanup if reset method not available
        const elementsToRemove = [
          'chatwidget-bubble',
          'chatwidget-container', 
          'chatwidget-overlay',
          'chatwidget-mobile-iframe',
          'chatwidget-theme-vars',
          'chatwidget-styles',
          'chatwidget-iframe',
          'chatwidget-widget',
          'chatwidget-animations'
        ];

        elementsToRemove.forEach(id => {
          const element = document.getElementById(id);
          if (element) {
            element.remove();
          }
        });

        if ((window as any).ChatWidget) {
          (window as any).ChatWidget._initialized = false;
        }
      }
    };

    cleanupExistingWidget();

    // Get theme colors and build widget URL
    const baseUrl = window.location.origin;
    const cleanUserId = user?.id?.split('|').pop() || user?.id;
    const widgetUrl = `${baseUrl}/widget/${cleanUserId}/${chatbot.guid}`;
    const theme = chatbot.homeScreenConfig?.theme;

    // Small delay to ensure cleanup is complete
    const timer = setTimeout(() => {
      // Load embed script only if not already loaded
      let script = document.querySelector('script[src="/embed.js"]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.src = '/embed.js';
        document.head.appendChild(script);
      }

      // Initialize widget after script loads
      const initWidget = () => {
        if ((window as any).ChatWidget) {
          try {
            // Get theme colors from the chatbot configuration
            const widgetConfig: any = {
              apiUrl: widgetUrl,
              position: position as 'bottom-right' | 'bottom-left',
              _forceReinit: true // Use the force reinit flag we added
            };

            // Apply theme colors from UI Designer if available
            if (theme) {
              if (theme.primaryColor) widgetConfig.primaryColor = theme.primaryColor;
              if (theme.backgroundColor) widgetConfig.backgroundColor = theme.backgroundColor;
              if (theme.textColor) widgetConfig.textColor = theme.textColor;
            }

            (window as any).ChatWidget.init(widgetConfig);
          } catch (error) {
            console.log('Widget initialization error:', error);
          }
        } else {
          // If ChatWidget is not available, try again in a short delay
          setTimeout(initWidget, 50);
        }
      };

      // Always call initWidget with a slight delay to ensure cleanup is complete
      setTimeout(initWidget, 100);
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      cleanupExistingWidget();
    };
  }, [chatbot, user, position, widgetKey, isLoading, isAuthenticated, chatbotLoading]);

  if (isLoading || !isAuthenticated || chatbotLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!chatbot) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chatbot Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The chatbot you're looking for doesn't exist or you don't have permission to embed it.
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

  const baseUrl = window.location.origin;
  // Extract clean user ID (part after pipe character)
  const cleanUserId = user?.id?.split('|').pop() || user?.id;
  const widgetUrl = `${baseUrl}/widget/${cleanUserId}/${chatbot.guid}`;
  
  // Get theme colors from UI Designer configuration
  const theme = chatbot.homeScreenConfig?.theme;
  
  // Build embed code with UI Designer colors
  const buildEmbedParams = () => {
    const baseParams = [
      `    apiUrl: '${widgetUrl}'`,
      `    position: '${position}'`
    ];
    
    const themeParams: string[] = [];
    if (theme) {
      if (theme.primaryColor) themeParams.push(`    primaryColor: '${theme.primaryColor}'`);
      if (theme.backgroundColor) themeParams.push(`    backgroundColor: '${theme.backgroundColor}'`);
      if (theme.textColor) themeParams.push(`    textColor: '${theme.textColor}'`);
    }
    
    return [...baseParams, ...themeParams].join(',\n');
  };
  
  const embedCode = `<script src="${baseUrl}/embed.js"></script>
<script>
  ChatWidget.init({
${buildEmbedParams()}
  });
</script>`;

  const iframeCode = `<iframe 
  src="${widgetUrl}" 
  width="400" 
  height="600" 
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
</iframe>`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${type} code copied to clipboard`,
      });
    });
  };

  // Clean up and refresh widget for testing
  const refreshWidget = () => {
    setWidgetKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
            <Code className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">
              Embed: {chatbot.name}
            </h1>
          </div>
          <p className="text-muted-foreground">
            Integrate your chatbot into any website with our easy-to-use embed codes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Widget Settings
                </CardTitle>
                <CardDescription>
                  Customize how your widget appears
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Select value={position} onValueChange={(value: any) => setPosition(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">💡 Customize Colors</p>
                  <p className="text-blue-700 dark:text-blue-200">
                    To set custom theme colors, use the <strong>UI Designer</strong> page. Colors configured there will automatically appear below and be included in your embed code.
                  </p>
                </div>

                {/* Display UI Designer Colors (Read-only) */}
                {theme && (
                  <>
                    {theme.primaryColor && (
                      <div>
                        <Label>Primary Color (from UI Designer)</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={theme.primaryColor}
                            readOnly
                            className="w-16 h-10 cursor-not-allowed opacity-75"
                          />
                          <Input
                            value={theme.primaryColor}
                            readOnly
                            className="flex-1 cursor-not-allowed opacity-75"
                          />
                        </div>
                      </div>
                    )}
                    {theme.backgroundColor && (
                      <div>
                        <Label>Background Color (from UI Designer)</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={theme.backgroundColor}
                            readOnly
                            className="w-16 h-10 cursor-not-allowed opacity-75"
                          />
                          <Input
                            value={theme.backgroundColor}
                            readOnly
                            className="flex-1 cursor-not-allowed opacity-75"
                          />
                        </div>
                      </div>
                    )}
                    {theme.textColor && (
                      <div>
                        <Label>Text Color (from UI Designer)</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={theme.textColor}
                            readOnly
                            className="w-16 h-10 cursor-not-allowed opacity-75"
                          />
                          <Input
                            value={theme.textColor}
                            readOnly
                            className="flex-1 cursor-not-allowed opacity-75"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {!theme && (
                  <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                    No custom colors configured. Use the UI Designer to set theme colors.
                  </div>
                )}

                <div className="pt-4">
                  <Button onClick={refreshWidget} className="w-full" variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Widget
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" asChild className="w-full justify-start">
                  <Link href={`/chatbots/${chatbot.guid}/ui-designer`}>
                    <Palette className="h-4 w-4 mr-2" />
                    UI Designer (Set Colors)
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="w-full justify-start">
                  <Link href={`/chatbots/${chatbot.guid}`}>
                    <Palette className="h-4 w-4 mr-2" />
                    Edit Configuration
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="w-full justify-start">
                  <Link href={`/chatbots/${chatbot.guid}/test`}>
                    <Globe className="h-4 w-4 mr-2" />
                    Test Chatbot
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Embed Codes */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="widget" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="widget">Floating Widget</TabsTrigger>
                <TabsTrigger value="iframe">Inline iframe</TabsTrigger>
              </TabsList>

              <TabsContent value="widget" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Floating Widget (Recommended)</CardTitle>
                    <CardDescription>
                      Adds a floating chat bubble to your website that opens when clicked
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Embed Code</Label>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(embedCode, 'Widget')}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Code
                        </Button>
                      </div>
                      <Textarea
                        value={embedCode}
                        readOnly
                        className="font-mono text-sm"
                        rows={8}
                      />
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium mb-2">How to use:</h4>
                      <ol className="text-sm text-muted-foreground space-y-1">
                        <li>1. Copy the embed code above</li>
                        <li>2. Paste it before the closing &lt;/body&gt; tag in your HTML</li>
                        <li>3. The chat widget will appear on all pages where the code is added</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="iframe" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Inline iframe</CardTitle>
                    <CardDescription>
                      Embeds the chat interface directly into your page content
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>iframe Code</Label>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(iframeCode, 'iframe')}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Code
                        </Button>
                      </div>
                      <Textarea
                        value={iframeCode}
                        readOnly
                        className="font-mono text-sm"
                        rows={6}
                      />
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium mb-2">How to use:</h4>
                      <ol className="text-sm text-muted-foreground space-y-1">
                        <li>1. Copy the iframe code above</li>
                        <li>2. Paste it wherever you want the chat to appear on your page</li>
                        <li>3. Adjust the width and height attributes as needed</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Live Widget Test */}
            <Card>
              <CardHeader>
                <CardTitle>Live Widget Test</CardTitle>
                <CardDescription>
                  Test your chatbot widget live on this demo website. The widget should appear in the {position.replace('-', ' ')} corner.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-8 min-h-[400px] relative overflow-hidden">
                  {/* Demo Website Content */}
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-neutral-800 mb-2">Demo Website</h3>
                      <p className="text-neutral-600">
                        This simulates your external website where the chat widget will be embedded.
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h4 className="text-lg font-semibold text-neutral-800 mb-3">About Our Service</h4>
                      <p className="text-neutral-600 text-sm leading-relaxed mb-3">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                        incididunt ut labore et dolore magna aliqua.
                      </p>
                      <p className="text-neutral-600 text-sm leading-relaxed">
                        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
                        eu fugiat nulla pariatur.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg shadow-sm p-4">
                        <h5 className="font-semibold text-neutral-800 mb-2">Features</h5>
                        <ul className="text-sm text-neutral-600 space-y-1">
                          <li>• Real-time chat support</li>
                          <li>• Customizable appearance</li>
                          <li>• Easy integration</li>
                        </ul>
                      </div>
                      <div className="bg-white rounded-lg shadow-sm p-4">
                        <h5 className="font-semibold text-neutral-800 mb-2">Test Instructions</h5>
                        <p className="text-sm text-neutral-600">
                          Click the chat widget in the {position.replace('-', ' ')} corner to test the chatbot.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Note about theme colors */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                    <p className="text-blue-900 font-medium mb-1">💡 Theme Integration</p>
                    <p className="text-blue-700">
                      Colors from your UI Designer are automatically applied to the widget and included in embed codes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            
          </div>
        </div>
      </div>
    </div>
  );
}
