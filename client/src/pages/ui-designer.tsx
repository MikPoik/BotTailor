import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  RefreshCw,
  Palette,
  RotateCcw
} from "lucide-react";
import { BackgroundImageUpload } from "@/components/ui/background-image-upload";
import type { HomeScreenConfig, ChatbotConfig } from "@shared/schema";

// Default configuration fallback
const getDefaultConfig = (): HomeScreenConfig => ({
  version: "1.0",
  components: [
    {
      id: "header_default",
      type: "header",
      props: {
        title: "Welcome",
        subtitle: "How can we help you today?",
      },
      order: 1,
      visible: true,
    },
    {
      id: "topics_default",
      type: "topic_grid",
      props: {
        topics: [
          {
            id: "help",
            title: "Get Help",
            description: "Ask a question or get support",
            icon: "MessageCircle",
            actionType: "message",
            message: "Hi! How can I help you today?",
            category: "general",
          },
        ],
        titleFontSize: "16px",
        descriptionFontSize: "14px",
      },
      order: 2,
      visible: true,
    },
  ],
  theme: {
    primaryColor: "#2563eb",
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
  },
  settings: {
    enableSearch: false,
    enableCategories: false,
    defaultCategory: "all",
  },
});

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [configKey, setConfigKey] = useState(0); // Force re-render key

  // Theme color states
  const [primaryColor, setPrimaryColor] = useState<string>("#2563eb");
  const [backgroundColor, setBackgroundColor] = useState<string>("#ffffff");
  const [textColor, setTextColor] = useState<string>("#1f2937");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>("");
  const [itemStyle, setItemStyle] = useState<'filled' | 'outlined'>('filled');
  const [headerTransparent, setHeaderTransparent] = useState<boolean>(false);
  const [titleFontSize, setTitleFontSize] = useState<string>("16px");
  const [descriptionFontSize, setDescriptionFontSize] = useState<string>("14px");

  // Fetch chatbot configuration
  const { data: chatbot, isLoading: chatbotLoading } = useQuery<ChatbotConfig>({
    queryKey: [`/api/chatbots/${guid}`],
    enabled: isAuthenticated && !!guid,
    retry: false,
  });

  // Initialize with existing config or default
  useEffect(() => {
    if (chatbot?.homeScreenConfig) {
      const config = chatbot.homeScreenConfig as HomeScreenConfig;
      setCurrentConfig(config);
      setConfigKey(prev => prev + 1); // Force initial render

      // Initialize theme colors from the loaded configuration
      if (config.theme) {
        if (config.theme.primaryColor) setPrimaryColor(config.theme.primaryColor);
        if (config.theme.backgroundColor) setBackgroundColor(config.theme.backgroundColor);
        if (config.theme.textColor) setTextColor(config.theme.textColor);
        if (config.theme.backgroundImageUrl) setBackgroundImageUrl(config.theme.backgroundImageUrl);
      }

      // Initialize style settings from components
      const topicGridComponent = config.components?.find(c => c.type === 'topic_grid');
      if (topicGridComponent?.props?.style && typeof topicGridComponent.props.style === 'object') {
        const style = topicGridComponent.props.style as any;
        if (style.titleFontSize) setTitleFontSize(style.titleFontSize);
        if (style.descriptionFontSize) setDescriptionFontSize(style.descriptionFontSize);
      }

      const headerComponent = config.components?.find(c => c.type === 'header');
      if (headerComponent?.props?.style && typeof headerComponent.props.style === 'object') {
        const headerStyle = headerComponent.props.style as any;
        if (headerStyle.transparentBackground) {
          setHeaderTransparent(headerStyle.transparentBackground);
        }
      }
    }
  }, [chatbot]);

  // Update editable config when current config changes
  useEffect(() => {
    if (currentConfig) {
      setEditableConfig(JSON.stringify(currentConfig, null, 2));
      setHasUnsavedChanges(false);
    }
  }, [currentConfig]);

  // Apply theme colors to CSS variables and update editable config
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--chat-primary-color', primaryColor);
    root.style.setProperty('--chat-background', backgroundColor);
    root.style.setProperty('--chat-text', textColor);

    // Update editable config to reflect theme changes
    if (currentConfig) {
      const updatedConfig = {
        ...currentConfig,
        theme: {
          ...currentConfig.theme,
          primaryColor: primaryColor,
          backgroundColor: backgroundColor,
          textColor: textColor
        }
      };
      setEditableConfig(JSON.stringify(updatedConfig, null, 2));
    }
  }, [primaryColor, backgroundColor, textColor, currentConfig]);

  // Track unsaved changes
  useEffect(() => {
    if (currentConfig && editableConfig) {
      try {
        const parsedEditable = JSON.parse(editableConfig);
        const configString = JSON.stringify(currentConfig);
        const editableString = JSON.stringify(parsedEditable);
        setHasUnsavedChanges(configString !== editableString);
      } catch {
        // If JSON is invalid, consider it as having changes
        setHasUnsavedChanges(true);
      }
    }
  }, [editableConfig, currentConfig]);

  // Keyboard shortcut for saving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges && currentConfig) {
          handleApplyAndSave();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, currentConfig]);

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
    onSuccess: (data: { config: HomeScreenConfig; explanation?: string }) => {
      setCurrentConfig(data.config);
      setConfigKey(prev => prev + 1); // Force re-render

      // Use AI explanation if available, otherwise use default message
      const responseMessage = data.explanation || 'I\'ve generated your new home screen layout! You can see the preview on the right.';

      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          content: responseMessage,
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
    onSuccess: (data) => {
      // Update the chatbot data in cache and refresh queries
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/guid/${guid}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${guid}`] });

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

    // Include current theme colors in the prompt context
    const enhancedPrompt = `${prompt}

Current Theme Colors:
- Primary Color: ${primaryColor}
- Background Color: ${backgroundColor}  
- Text Color: ${textColor}

Please consider these colors when generating the UI design to ensure visual consistency.`;

    try {
      await generateUIMutation.mutateAsync({
        prompt: enhancedPrompt,
        currentConfig: currentConfig || undefined,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveConfig = () => {
    if (currentConfig) {
      try {
        // Parse the current editable config to ensure we're saving the latest changes
        const configToSave = JSON.parse(editableConfig);

        // Ensure theme colors from the Theme tab are included in the configuration
        configToSave.theme = {
          ...configToSave.theme,
          primaryColor: primaryColor,
          backgroundColor: backgroundColor,
          textColor: textColor,
          backgroundImageUrl: backgroundImageUrl
        };

        // Update style settings in components
        const topicGridComponent = configToSave.components?.find((c: any) => c.type === 'topic_grid');
        if (topicGridComponent) {
          topicGridComponent.props.style = {
            ...topicGridComponent.props.style,
            itemStyle: itemStyle,
            titleFontSize: titleFontSize,
            descriptionFontSize: descriptionFontSize
          };
        }

        const headerComponent = configToSave.components?.find((c: any) => c.type === 'header');
        if (headerComponent) {
          headerComponent.props.style = {
            ...headerComponent.props.style,
            transparentBackground: headerTransparent
          };
        }

        saveConfigMutation.mutate(configToSave);
      } catch (error) {
        toast({
          title: "Invalid JSON",
          description: "Please check your JSON syntax before saving.",
          variant: "destructive",
        });
        console.error("JSON parsing error:", error);
        return;
      }
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
      setHasUnsavedChanges(false);
      setConfigKey(prev => prev + 1); // Force re-render
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

  const handleApplyAndSave = () => {
    try {
      const parsedConfig = JSON.parse(editableConfig);

      // Ensure theme colors from the Theme tab are included in the configuration
      parsedConfig.theme = {
        ...parsedConfig.theme,
        primaryColor: primaryColor,
        backgroundColor: backgroundColor,
        textColor: textColor,
        backgroundImageUrl: backgroundImageUrl
      };

      // Update style settings in components
      const topicGridComponent = parsedConfig.components?.find((c: any) => c.type === 'topic_grid');
      if (topicGridComponent) {
        topicGridComponent.props.style = {
          ...topicGridComponent.props.style,
          itemStyle: itemStyle,
          titleFontSize: titleFontSize,
          descriptionFontSize: descriptionFontSize
        };
      }

      const headerComponent = parsedConfig.components?.find((c: any) => c.type === 'header');
      if (headerComponent) {
        headerComponent.props.style = {
          ...headerComponent.props.style,
          transparentBackground: headerTransparent
        };
      }

      setCurrentConfig(parsedConfig);
      setHasUnsavedChanges(false);
      setConfigKey(prev => prev + 1); // Force re-render
      saveConfigMutation.mutate(parsedConfig);
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your JSON syntax before saving.",
        variant: "destructive",
      });
    }
  };

  const handleResetConfig = () => {
    const defaultConfig = getDefaultConfig();
    setCurrentConfig(defaultConfig);
    setConfigKey(prev => prev + 1); // Force re-render

    // Reset theme colors and style settings to default
    setPrimaryColor(defaultConfig.theme?.primaryColor || "#2563eb");
    setBackgroundColor(defaultConfig.theme?.backgroundColor || "#ffffff");
    setTextColor(defaultConfig.theme?.textColor || "#1f2937");
    setBackgroundImageUrl("");
    setItemStyle('filled');
    setHeaderTransparent(false);
    setTitleFontSize("16px");
    setDescriptionFontSize("14px");

    toast({
      title: "Configuration Reset",
      description: "Home screen has been reset to default configuration.",
    });
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
      <div className="container max-w-4xl mx-auto py-8">
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
    <div className="container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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
            <div className="flex gap-2">
              <Button 
                onClick={handleResetConfig}
                variant="outline"
                size="sm"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
              <Button 
                onClick={handleSaveConfig}
                disabled={saveConfigMutation.isPending}
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Save Design
              </Button>
            </div>
          )}
        </div>
        <p className="text-muted-foreground">
          Design custom home screens for {chatbot.name}
        </p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(80vh-200px)]">

        {/* Left Panel - Chat & Code */}
        <div className="flex flex-col">
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="theme" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Theme
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Code
              </TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 flex flex-col min-h-0">
              <Card className="flex-1 flex flex-col min-h-0">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    AI Designer Assistant
                  </CardTitle>
                  <CardDescription>
                    Tell me what kind of home screen you want to create
                  </CardDescription>
                </CardHeader>

                {/* Chat History */}
                <CardContent className="flex-1 flex flex-col min-h-0">
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
                  <div className="flex gap-2 flex-shrink-0">
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

            {/* Theme Tab */}
            <TabsContent value="theme" className="flex-1 min-h-0">
              <Card className="h-full flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Theme Colors
                  </CardTitle>
                  <CardDescription>
                    Customize the widget colors that will be applied to your design and included in AI prompts
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="primary-color">Primary Color</Label>
                      <div className="flex items-center space-x-3 mt-2">
                        <Input
                          id="primary-color"
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="flex-1"
                          placeholder="#2563eb"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Used for buttons, links, and accent elements
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="background-color">Background Color</Label>
                      <div className="flex items-center space-x-3 mt-2">
                        <Input
                          id="background-color"
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          type="text"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="flex-1"
                          placeholder="#ffffff"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Main background color of the widget
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="text-color">Text Color</Label>
                      <div className="flex items-center space-x-3 mt-2">
                        <Input
                          id="text-color"
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          type="text"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="flex-1"
                          placeholder="#1f2937"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Primary text color throughout the widget
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="item-style">Menu Item Style</Label>
                      <div className="mt-2">
                        <Select value={itemStyle} onValueChange={(value: 'filled' | 'outlined') => setItemStyle(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select menu item style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="filled">Filled - Items filled with primary color</SelectItem>
                            <SelectItem value="outlined">Outlined - Items with primary color border</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Choose how menu items in the topic grid should be styled
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title-font-size">Title Font Size</Label>
                        <div className="mt-2">
                          <Select value={titleFontSize} onValueChange={setTitleFontSize}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select title font size" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="12px">12px - Extra Small</SelectItem>
                              <SelectItem value="14px">14px - Small</SelectItem>
                              <SelectItem value="16px">16px - Medium</SelectItem>
                              <SelectItem value="18px">18px - Large</SelectItem>
                              <SelectItem value="20px">20px - Extra Large</SelectItem>
                              <SelectItem value="24px">24px - XXL</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description-font-size">Description Font Size</Label>
                        <div className="mt-2">
                          <Select value={descriptionFontSize} onValueChange={setDescriptionFontSize}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select description font size" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10px">10px - Extra Small</SelectItem>
                              <SelectItem value="12px">12px - Small</SelectItem>
                              <SelectItem value="14px">14px - Medium</SelectItem>
                              <SelectItem value="16px">16px - Large</SelectItem>
                              <SelectItem value="18px">18px - Extra Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Adjust the font sizes for topic titles and descriptions in the menu grid
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <Label>Background Image</Label>
                      <div className="mt-2">
                        <BackgroundImageUpload
                          value={backgroundImageUrl}
                          onValueChange={setBackgroundImageUrl}
                          disabled={saveConfigMutation.isPending}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Optional background image for the home screen. Will be applied behind the content.
                      </p>
                    </div>

                    {backgroundImageUrl && (
                      <div className="space-y-3">
                        <Label htmlFor="header-transparent" className="flex items-center space-x-2 cursor-pointer">
                          <input
                            id="header-transparent"
                            type="checkbox"
                            checked={headerTransparent}
                            onChange={(e) => setHeaderTransparent(e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <span>Transparent Header Background</span>
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Make the header background transparent to show the background image behind it
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Preview</h4>
                    <div 
                      className="border rounded-lg p-4 space-y-3"
                      style={{
                        backgroundColor: backgroundColor,
                        color: textColor,
                      }}
                    >
                      <div className="font-medium">Widget Preview</div>
                      <p className="text-sm opacity-80">
                        This is how your text will appear with the current color scheme.
                      </p>
                      <Button 
                        size="sm"
                        style={{
                          backgroundColor: primaryColor,
                          borderColor: primaryColor,
                          color: backgroundColor,
                        }}
                      >
                        Primary Button
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                    <strong>Note:</strong> These colors will be automatically included in your AI prompts 
                    to ensure generated designs match your brand colors. The colors also apply immediately 
                    to the preview on the right.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Code Tab */}
            <TabsContent value="code" className="flex-1 min-h-0">
              <Card className="h-full flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle>Configuration</CardTitle>
                    {hasUnsavedChanges && (
                      <Badge variant="destructive">Unsaved Changes</Badge>
                    )}
                  </div>
                  <div className="flex gap-2 mb-2">
                    {currentConfig && (
                      <>
                        <Button variant="outline" size="sm" onClick={handleCopyConfig}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleResetConfig}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleApplyConfig}
                          disabled={!hasUnsavedChanges}
                        >
                          Apply to Preview
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleApplyAndSave}
                          disabled={saveConfigMutation.isPending || !hasUnsavedChanges}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Apply & Save
                        </Button>
                      </>
                    )}
                  </div>
                  <CardDescription>
                    Edit the JSON configuration directly. Use "Apply to Preview" to see changes, or "Apply & Save" to update and save permanently. Press Ctrl+S to save quickly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col min-h-0 p-6 pt-0">
                  {currentConfig ? (
                    <Textarea
                      value={editableConfig}
                      onChange={(e) => setEditableConfig(e.target.value)}
                      className="flex-1 font-mono text-xs resize-none min-h-0"
                      placeholder="Edit your configuration here..."
                    />
                  ) : (
                    <div className="flex-1 bg-muted rounded-lg flex items-center justify-center text-muted-foreground min-h-0">
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
                <div className="h-[800px] overflow-y-auto">
                  {currentConfig ? (
                    <DynamicHomeScreen 
                      key={configKey}
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