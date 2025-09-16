import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, RefreshCw } from "lucide-react";

interface ChatbotConfig {
  id: number;
  guid: string;
  name: string;
  description: string;
  isActive: boolean;
  homeScreenConfig?: {
    theme?: {
      primaryColor?: string;
      backgroundColor?: string;
      textColor?: string;
    };
  };
}

export default function WidgetTest() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedChatbot, setSelectedChatbot] = useState<string>("");
  const [position, setPosition] = useState<string>("bottom-right");
  const [widgetKey, setWidgetKey] = useState<number>(0);

  const { data: chatbots } = useQuery<ChatbotConfig[]>({
    queryKey: ['/api/chatbots'],
    enabled: isAuthenticated,
  });

  // Fetch detailed config for selected chatbot to get theme colors
  const { data: selectedChatbotConfig } = useQuery<ChatbotConfig>({
    queryKey: [`/api/chatbots/${selectedChatbot}`],
    enabled: isAuthenticated && !!selectedChatbot,
  });

  // Auto-select first chatbot when available
  useEffect(() => {
    if (chatbots && chatbots.length > 0 && !selectedChatbot) {
      setSelectedChatbot(chatbots[0].guid);
    }
  }, [chatbots, selectedChatbot]);

  // Helper function to extract clean user ID
  const getCleanUserId = (fullUserId?: string): string => {
    if (!fullUserId) return "";
    const parts = fullUserId.split('|');
    return parts.length > 1 ? parts[1] : fullUserId;
  };

  const cleanUserId = getCleanUserId((user as any)?.id);

  // Load and initialize chat widget
  useEffect(() => {
    if (!selectedChatbot || !user) return;

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
            const theme = selectedChatbotConfig?.homeScreenConfig?.theme;
            const widgetConfig: any = {
              apiUrl: `${window.location.origin}/widget/${cleanUserId}/${selectedChatbot}`,
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
  }, [selectedChatbot, user, position, widgetKey, selectedChatbotConfig, cleanUserId]);

  const refreshWidget = () => {
    setWidgetKey(prev => prev + 1);
  };

  const generateEmbedCode = () => {
    if (!selectedChatbot || !user) return "";

    // Get theme colors from the chatbot configuration
    const theme = selectedChatbotConfig?.homeScreenConfig?.theme;

    // Build the configuration object
    const config = {
      apiUrl: `${window.location.origin}/widget/${cleanUserId}/${selectedChatbot}`,
      position: position
    };

    // Add theme colors if available
    const themeParams: string[] = [];
    if (theme) {
      if (theme.primaryColor) themeParams.push(`    primaryColor: '${theme.primaryColor}'`);
      if (theme.backgroundColor) themeParams.push(`    backgroundColor: '${theme.backgroundColor}'`);
      if (theme.textColor) themeParams.push(`    textColor: '${theme.textColor}'`);
    }

    const baseParams = [
      `    apiUrl: '${config.apiUrl}'`,
      `    position: '${config.position}'`
    ];

    const allParams = [...baseParams, ...themeParams].join(',\n');

    return `<script src="${window.location.origin}/embed.js"></script>
<script>
  ChatWidget.init({
${allParams}
  });
</script>`;
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative">
      {/* Configuration Panel */}
      <div className="absolute top-4 left-4 z-50">
        <Card className="w-80 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Widget Test Panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="chatbot-select">Select Chatbot</Label>
              <Select value={selectedChatbot} onValueChange={setSelectedChatbot}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a chatbot" />
                </SelectTrigger>
                <SelectContent>
                  {chatbots?.map((chatbot) => (
                    <SelectItem key={chatbot.guid} value={chatbot.guid}>
                      {chatbot.name} {!chatbot.isActive && "(Inactive)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="position-select">Position</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button onClick={refreshWidget} className="w-full" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Widget
              </Button>

              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={() => navigator.clipboard.writeText(generateEmbedCode())}
              >
                Copy Embed Code
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demo Website Content */}
      <div className="min-h-screen p-8 pl-96">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-neutral-800 mb-4">Demo Website</h1>
          <p className="text-lg text-neutral-600 mb-8">
            This simulates your external website where the chat widget will be embedded.
            The widget should appear in the {position.replace('-', ' ')} corner.
          </p>

          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-semibold text-neutral-800 mb-4">About Our Service</h2>
            <p className="text-neutral-600 leading-relaxed mb-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis 
              nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <p className="text-neutral-600 leading-relaxed">
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
              eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, 
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">Features</h3>
              <ul className="space-y-2 text-neutral-600">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Real-time chat support
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Customizable appearance
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Easy integration
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">Test Instructions</h3>
              <p className="text-neutral-600 mb-4">
                Use the panel on the left to:
              </p>
              <ul className="text-sm text-neutral-600 space-y-1">
                <li>• Select different chatbots</li>
                <li>• Change widget position</li>
                <li>• Copy embed code for external sites</li>
              </ul>
              <p className="text-sm text-neutral-600 mt-4 p-3 bg-blue-50 rounded-lg">
                <strong>Note:</strong> To customize colors and themes, use the UI Designer page. 
                Colors configured there will automatically apply to the widget and be included in AI prompts.
              </p>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold text-neutral-800 mb-3">Embed Code</h3>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
              <code>{generateEmbedCode()}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}