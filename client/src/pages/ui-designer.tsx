import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import DynamicHomeScreen from "@/components/ui-designer/dynamic-home-screen";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Send, 
  Copy, 
  Eye, 
  Code, 
  MessageSquare, 
  Wand2, 
  Download,
  RefreshCw
} from "lucide-react";
import type { HomeScreenConfig, ChatbotConfig } from "@shared/schema";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  config?: HomeScreenConfig;
}

export default function UIDesigner() {
  const { guid } = useParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [prompt, setPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentConfig, setCurrentConfig] = useState<HomeScreenConfig | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editableConfig, setEditableConfig] = useState<string>("");

  // Fetch chatbot configuration
  const { data: chatbot, isLoading: chatbotLoading } = useQuery<ChatbotConfig>({
    queryKey: [`/api/chatbots/guid/${guid}`],
    enabled: isAuthenticated && !!guid,
    retry: false,
  });

  // Initialize with existing config or default
  useEffect(() => {
    if (chatbot?.homeScreenConfig) {
      setCurrentConfig(chatbot.homeScreenConfig as HomeScreenConfig);
    }
  }, [chatbot]);

  // Update editable config when current config changes
  useEffect(() => {
    if (currentConfig) {
      setEditableConfig(JSON.stringify(currentConfig, null, 2));
    }
  }, [currentConfig]);

  // Generate UI mutation
  const generateUIMutation = useMutation({
    mutationFn: async (data: { prompt: string; currentConfig?: HomeScreenConfig }) => {
      const endpoint = data.currentConfig 
        ? `/api/ui-designer/modify`
        : `/api/ui-designer/generate`;
      
      const payload = {
        ...data,
        chatbotId: chatbot?.id
      };
      
      const response = await apiRequest("POST", endpoint, payload);
      return response.json();
    },
    onSuccess: (data: { config: HomeScreenConfig }) => {
      setCurrentConfig(data.config);
      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I\'ve generated your new home screen layout! You can see the preview on the right.',
          timestamp: new Date(),
          config: data.config,
        }
      ]);
      setPrompt("");
      toast({
        title: "UI Generated",
        description: "Your home screen layout has been updated!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (config: HomeScreenConfig) => {
      const response = await apiRequest("PATCH", `/api/chatbots/guid/${guid}`, { homeScreenConfig: config });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/guid/${guid}`] });
      toast({
        title: "Configuration Saved",
        description: "Your home screen design has been saved successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendPrompt = async () => {
    if (!prompt.trim()) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    setIsGenerating(true);
    
    try {
      await generateUIMutation.mutateAsync({
        prompt,
        currentConfig: currentConfig || undefined,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveConfig = () => {
    if (currentConfig) {
      saveConfigMutation.mutate(currentConfig);
    }
  };

  const handleCopyConfig = () => {
    if (currentConfig) {
      navigator.clipboard.writeText(JSON.stringify(currentConfig, null, 2));
      toast({
        title: "Copied",
        description: "Configuration copied to clipboard!",
      });
    }
  };

  const handleApplyConfig = () => {
    try {
      const parsedConfig = JSON.parse(editableConfig);
      setCurrentConfig(parsedConfig);
      toast({
        title: "Configuration Applied",
        description: "Your changes have been applied to the preview!",
      });
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your JSON syntax and try again.",
        variant: "destructive",
      });
    }
  };

  const handleTopicClick = (topic: any) => {
    toast({
      title: "Topic Selected",
      description: `Topic: ${topic.title}`,
    });
  };

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
            The chatbot you're looking for doesn't exist or you don't have permission to edit it.
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

  return (
    <div className="container max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">UI Designer</h1>
            {currentConfig && (
              <Badge variant="outline">Custom</Badge>
            )}
          </div>
          {currentConfig && (
            <Button 
              onClick={handleSaveConfig}
              disabled={saveConfigMutation.isPending}
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Save Design
            </Button>
          )}
        </div>
        <p className="text-muted-foreground">
          Design custom home screens for {chatbot.name}
        </p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        
        {/* Left Panel - Chat & Code */}
        <div className="flex flex-col">
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Code
              </TabsTrigger>
            </TabsList>
            
            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 flex flex-col">
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    AI Designer Assistant
                  </CardTitle>
                  <CardDescription>
                    Tell me what kind of home screen you want to create
                  </CardDescription>
                </CardHeader>
                
                {/* Chat History */}
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
                    {chatHistory.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Start by describing your ideal home screen</p>
                        <p className="text-sm mt-2">
                          Example: "Create a modern support center with billing, technical support, and sales categories"
                        </p>
                      </div>
                    )}
                    
                    {chatHistory.map((message, index) => (
                      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {isGenerating && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Generating your design...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Describe your home screen design..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendPrompt()}
                      disabled={isGenerating}
                    />
                    <Button 
                      onClick={handleSendPrompt}
                      disabled={!prompt.trim() || isGenerating}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Code Tab */}
            <TabsContent value="code" className="flex-1">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Configuration</CardTitle>
                    <div className="flex gap-2">
                      {currentConfig && (
                        <>
                          <Button variant="outline" size="sm" onClick={handleCopyConfig}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                          <Button size="sm" onClick={handleApplyConfig}>
                            Apply Changes
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <CardDescription>
                    Edit the JSON configuration directly. Click "Apply Changes" to update the preview.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col h-full">
                  {currentConfig ? (
                    <Textarea
                      value={editableConfig}
                      onChange={(e) => setEditableConfig(e.target.value)}
                      className="flex-1 font-mono text-xs resize-none"
                      placeholder="Edit your configuration here..."
                    />
                  ) : (
                    <div className="flex-1 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                      No configuration generated yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex flex-col">
          <Card className="flex-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Live Preview
                </CardTitle>
                <Badge variant="outline">
                  {currentConfig ? 'Custom' : 'Default'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border rounded-lg overflow-hidden bg-background">
                <div className="h-[500px] overflow-y-auto">
                  {currentConfig ? (
                    <DynamicHomeScreen 
                      config={currentConfig}
                      onTopicClick={handleTopicClick}
                      onActionClick={(action) => console.log('Action:', action)}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Generate a design to see preview</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}