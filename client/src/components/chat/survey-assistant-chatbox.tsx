import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, RefreshCw, Wand2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type SurveyConfig } from "@shared/schema";

interface SurveyAssistantMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  action?: string;
  surveyConfig?: SurveyConfig;
}

interface Survey {
  id: number;
  name: string;
  description?: string;
  surveyConfig: SurveyConfig | unknown;
  status: string;
  chatbotConfigId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SurveyAssistantChatboxProps {
  currentSurvey: Survey | null;
  onSurveyGenerated: (newSurveyConfig: SurveyConfig) => void;
  chatbotConfig: {
    name?: string;
    description?: string;
  };
  chatbotGuid: string;
}

export default function SurveyAssistantChatbox({ 
  currentSurvey, 
  onSurveyGenerated, 
  chatbotConfig,
  chatbotGuid 
}: SurveyAssistantChatboxProps) {
  const [messages, setMessages] = useState<SurveyAssistantMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    // Use setTimeout to ensure the scroll happens after the DOM update
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const surveyAssistantMutation = useMutation({
    mutationFn: async ({ action, userMessage }: { action: string; userMessage?: string }) => {
      const response = await apiRequest('POST', '/api/chatbots/' + chatbotGuid + '/survey-assistant', {
        action,
        context: {
          chatbotName: chatbotConfig.name,
          description: chatbotConfig.description,
          currentSurvey: currentSurvey ? {
            name: currentSurvey.name,
            description: currentSurvey.description,
            surveyConfig: currentSurvey.surveyConfig
          } : null
        },
        userMessage: userMessage || ""
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      const response = data.response;
      
      if (response?.bubbles && Array.isArray(response.bubbles)) {
        // Handle bubble responses and extract survey config
        const newMessages: SurveyAssistantMessage[] = response.bubbles.map((bubble: any, index: number) => {
          return {
            id: Date.now().toString() + '-assistant-' + index,
            content: bubble.content,
            sender: 'assistant' as const,
            timestamp: new Date(),
            action: variables.action,
            surveyConfig: bubble.metadata?.surveyConfig
          };
        });
        
        setMessages(prev => [...prev, ...newMessages]);
      } else {
        // Single response fallback
        const assistantMessage: SurveyAssistantMessage = {
          id: Date.now().toString() + '-assistant',
          content: response?.content || "I couldn't generate a response.",
          sender: 'assistant',
          timestamp: new Date(),
          action: variables.action
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to get survey assistance. Please try again.",
        variant: "destructive",
      });
      console.error("Survey assistant error:", error);
    }
  });

  const handleQuickAction = (action: string, label: string) => {
    const userMessage: SurveyAssistantMessage = {
      id: Date.now().toString() + '-user',
      content: label,
      sender: 'user',
      timestamp: new Date(),
      action
    };
    
    setMessages(prev => [...prev, userMessage]);
    surveyAssistantMutation.mutate({ action });
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || surveyAssistantMutation.isPending) return;

    const userMessage: SurveyAssistantMessage = {
      id: Date.now().toString() + '-user',
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    surveyAssistantMutation.mutate({ action: 'custom', userMessage: inputMessage });
    setInputMessage("");
  };

  const handleApplySurvey = (surveyConfig: SurveyConfig) => {
    onSurveyGenerated(surveyConfig);
    toast({
      title: "Survey Applied",
      description: "The generated survey has been applied to your current survey!",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Quick Actions */}
      <div className="p-4 border-b bg-muted/30">
        <div className="grid grid-cols-2 gap-2">
          <Button 
            type="button"
            variant="outline" 
            size="sm"
            onClick={() => handleQuickAction('generate_customer_satisfaction', 'Generate Customer Satisfaction Survey')}
            disabled={surveyAssistantMutation.isPending}
            data-testid="button-generate-customer-satisfaction"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Customer Satisfaction
          </Button>
          <Button 
            type="button"
            variant="outline" 
            size="sm"
            onClick={() => handleQuickAction('generate_feedback', 'Generate Feedback Survey')}
            disabled={surveyAssistantMutation.isPending}
            data-testid="button-generate-feedback"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Product Feedback
          </Button>
        </div>
        {currentSurvey && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button 
              type="button"
              variant="outline" 
              size="sm"
              onClick={() => handleQuickAction('improve_questions', 'Improve Current Questions')}
              disabled={surveyAssistantMutation.isPending}
              data-testid="button-improve-questions"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Improve Questions
            </Button>
            <Button 
              type="button"
              variant="outline" 
              size="sm"
              onClick={() => handleQuickAction('add_questions', 'Add More Questions')}
              disabled={surveyAssistantMutation.isPending}
              data-testid="button-add-questions"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Add Questions
            </Button>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Survey AI Assistant</p>
              <p className="text-sm">Ask me to create surveys, improve questions, or add new questions to your current survey.</p>
              <p className="text-xs mt-2">Try the quick actions above or type your own request!</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 opacity-70 ${
                  message.sender === 'user' ? 'text-primary-foreground' : 'text-muted-foreground'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
                
                {/* Show Apply Survey button if message has surveyConfig */}
                {message.surveyConfig && message.sender === 'assistant' && (
                  <div className="mt-3 pt-3 border-t border-border/20">
                    <Button 
                      type="button"
                      size="sm" 
                      onClick={() => handleApplySurvey(message.surveyConfig!)}
                      data-testid="button-apply-survey"
                    >
                      Apply Survey
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {surveyAssistantMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Generating survey...</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to generate surveys, improve questions, or add new ones..."
            disabled={surveyAssistantMutation.isPending}
            data-testid="input-survey-message"
          />
          <Button
            type="button"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || surveyAssistantMutation.isPending}
            data-testid="button-send-survey-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}