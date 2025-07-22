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
}

export default function WidgetTest() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedChatbot, setSelectedChatbot] = useState<string>("");
  const [position, setPosition] = useState<string>("bottom-right");
  const [primaryColor, setPrimaryColor] = useState<string>("#2563eb");
  const [widgetKey, setWidgetKey] = useState<number>(0);

  const { data: chatbots } = useQuery<ChatbotConfig[]>({
    queryKey: ['/api/chatbots'],
    enabled: isAuthenticated,
  });

  // Auto-select first chatbot when available
  useEffect(() => {
    if (chatbots && chatbots.length > 0 && !selectedChatbot) {
      setSelectedChatbot(chatbots[0].guid);
    }
  }, [chatbots, selectedChatbot]);

  // Load and initialize chat widget
  useEffect(() => {
    if (!selectedChatbot || !user) return;

    // Remove existing widget if any
    const existingContainer = document.getElementById('chatwidget-container');
    if (existingContainer) {
      existingContainer.remove();
    }

    // Remove existing overlay and mobile iframe
    const existingOverlay = document.getElementById('chatwidget-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    const existingMobileIframe = document.getElementById('chatwidget-mobile-iframe');
    if (existingMobileIframe) {
      existingMobileIframe.remove();
    }

    // Load embed script
    const script = document.createElement('script');
    script.src = '/embed.js';
    script.onload = () => {
      // Initialize widget after script loads
      if ((window as any).ChatWidget) {
        (window as any).ChatWidget.init({
          apiUrl: `${window.location.origin}/widget/${user.id}/${selectedChatbot}`,
          position: position as 'bottom-right' | 'bottom-left',
          primaryColor: primaryColor
        });
      }
    };

    document.head.appendChild(script);

    // Cleanup function
    return () => {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [selectedChatbot, user, position, primaryColor, widgetKey]);

  const refreshWidget = () => {
    setWidgetKey(prev => prev + 1);
  };

  const generateEmbedCode = () => {
    if (!selectedChatbot || !user) return "";

    return `<script src="${window.location.origin}/embed.js"></script>
<script>
  ChatWidget.init({
    apiUrl: '${window.location.origin}/widget/${user.id}/${selectedChatbot}',
    position: '${position}',
    primaryColor: '${primaryColor}'
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

            <div>
              <Label htmlFor="color-input">Primary Color</Label>
              <Input
                id="color-input"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10"
              />
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
                <li>• Customize primary color</li>
                <li>• Copy embed code for external sites</li>
              </ul>
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