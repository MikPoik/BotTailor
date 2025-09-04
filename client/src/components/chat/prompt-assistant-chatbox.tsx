import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, RefreshCw, Zap, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Function to extract the actual system prompt from AI response
function extractSystemPrompt(content: string): string {
  // Look for patterns like "**Improved System Prompt:**" or "System Prompt:" followed by the actual prompt
  const patterns = [
    "**Improved System Prompt:**",
    "**System Prompt:**", 
    "System Prompt:",
    "Improved prompt:",
    "New prompt:"
  ];
  
  for (const pattern of patterns) {
    const patternIndex = content.indexOf(pattern);
    if (patternIndex !== -1) {
      // Find the start of the actual prompt (after the pattern and any whitespace/newlines)
      let startIndex = patternIndex + pattern.length;
      while (startIndex < content.length && /\s/.test(content[startIndex])) {
        startIndex++;
      }
      
      // Find the end - look for the next "**" or explanation section
      let endIndex = content.length;
      const nextPattern = content.indexOf("**", startIndex);
      const explanationIndex = content.toLowerCase().indexOf("explanation", startIndex);
      const improvementIndex = content.toLowerCase().indexOf("improvement", startIndex);
      
      if (nextPattern !== -1) endIndex = Math.min(endIndex, nextPattern);
      if (explanationIndex !== -1) endIndex = Math.min(endIndex, explanationIndex);
      if (improvementIndex !== -1) endIndex = Math.min(endIndex, improvementIndex);
      
      const extractedPrompt = content.substring(startIndex, endIndex).trim();
      if (extractedPrompt && extractedPrompt.length > 20) {
        return extractedPrompt;
      }
    }
  }
  
  // If no pattern matches and it's a simple prompt generation, use the whole content
  // but exclude obvious explanation text
  if (!content.includes("**") && !content.toLowerCase().includes("explanation") && content.length < 1000) {
    return content.trim();
  }
  
  return "";
}

interface PromptAssistantMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  action?: string;
  extractedPrompt?: string;
}

interface PromptAssistantChatboxProps {
  currentPrompt: string;
  onPromptGenerated: (newPrompt: string) => void;
  chatbotConfig: {
    name?: string;
    description?: string;
  };
  chatbotGuid: string;
}

export default function PromptAssistantChatbox({ 
  currentPrompt, 
  onPromptGenerated, 
  chatbotConfig,
  chatbotGuid 
}: PromptAssistantChatboxProps) {
  const [messages, setMessages] = useState<PromptAssistantMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [copiedPrompt, setCopiedPrompt] = useState("");
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

  const promptAssistantMutation = useMutation({
    mutationFn: async ({ action, userMessage }: { action: string; userMessage?: string }) => {
      const response = await apiRequest('POST', '/api/chatbots/' + chatbotGuid + '/prompt-assistant', {
        action,
        context: {
          chatbotName: chatbotConfig.name,
          description: chatbotConfig.description,
          currentPrompt: currentPrompt
        },
        userMessage: userMessage || ""
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      const response = data.response;
      
      // Extract content from all bubbles and combine them
      let fullContent = "";
      let extractedPrompt = "";
      
      if (response?.bubbles && Array.isArray(response.bubbles)) {
        // Combine all bubble content
        fullContent = response.bubbles.map((bubble: any) => bubble.content).join("\n\n");
        
        // For generate/improve actions, try to extract the actual prompt
        if (variables.action === 'generate' || variables.action === 'improve') {
          extractedPrompt = extractSystemPrompt(fullContent);
        }
      } else {
        fullContent = response?.content || "I couldn't generate a response.";
      }
      
      // Add assistant response to messages
      const assistantMessage: PromptAssistantMessage = {
        id: Date.now().toString() + '-assistant',
        content: fullContent,
        sender: 'assistant',
        timestamp: new Date(),
        action: variables.action,
        extractedPrompt: extractedPrompt || undefined
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to get prompt assistance. Please try again.",
        variant: "destructive",
      });
      console.error("Prompt assistant error:", error);
    }
  });

  const handleQuickAction = (action: string, label: string) => {
    const userMessage: PromptAssistantMessage = {
      id: Date.now().toString() + '-user',
      content: label,
      sender: 'user',
      timestamp: new Date(),
      action
    };
    
    setMessages(prev => [...prev, userMessage]);
    promptAssistantMutation.mutate({ action });
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || promptAssistantMutation.isPending) return;

    const userMessage: PromptAssistantMessage = {
      id: Date.now().toString() + '-user',
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      action: 'chat'
    };

    setMessages(prev => [...prev, userMessage]);
    promptAssistantMutation.mutate({ action: 'chat', userMessage: inputMessage });
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedPrompt(text);
      toast({
        title: "Copied!",
        description: "Prompt copied to clipboard",
      });
      setTimeout(() => setCopiedPrompt(""), 2000);
    });
  };

  const applyPrompt = (message: PromptAssistantMessage) => {
    const promptToApply = message.extractedPrompt || message.content;
    // Use setTimeout to prevent form auto-submission
    setTimeout(() => {
      onPromptGenerated(promptToApply);
      toast({
        title: "Applied!",
        description: "Prompt has been applied to the system prompt field. Review before saving.",
      });
    }, 100);
  };

  const copyPrompt = (message: PromptAssistantMessage) => {
    const promptToCopy = message.extractedPrompt || message.content;
    copyToClipboard(promptToCopy);
  };

  return (
    <Card className="p-4 space-y-4">
      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleQuickAction('generate', 'Generate new prompt');
          }}
          disabled={promptAssistantMutation.isPending}
          className="flex items-center gap-2"
        >
          <Sparkles className="h-3 w-3" />
          Generate
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleQuickAction('improve', 'Improve current prompt');
          }}
          disabled={promptAssistantMutation.isPending || !currentPrompt}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-3 w-3" />
          Improve
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleQuickAction('chat', 'Make it more professional');
          }}
          disabled={promptAssistantMutation.isPending}
          className="flex items-center gap-2"
        >
          <Zap className="h-3 w-3" />
          More Professional
        </Button>
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="h-64 w-full border rounded-md p-3">
        <div className="space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Ask me to generate or improve your chatbot's system prompt!</p>
              <p className="text-xs mt-1">Try the quick actions above or ask questions below.</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-3 ${
                message.sender === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.sender === 'assistant' && (message.action === 'generate' || message.action === 'improve') && (
                  <div className="flex gap-2 mt-2">
                    {message.extractedPrompt && (
                      <div className="text-xs text-muted-foreground mb-1">
                        ✨ System prompt extracted
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        copyPrompt(message);
                      }}
                      className="h-6 text-xs"
                    >
                      {copiedPrompt === (message.extractedPrompt || message.content) ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        applyPrompt(message);
                      }}
                      className="h-6 text-xs"
                    >
                      Apply {message.extractedPrompt ? "Prompt" : "All"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {promptAssistantMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <div className="animate-spin">
                    <Sparkles className="h-3 w-3" />
                  </div>
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="flex gap-2">
        <Input
          placeholder="Ask about prompt engineering..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={promptAssistantMutation.isPending}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSendMessage();
          }}
          disabled={!inputMessage.trim() || promptAssistantMutation.isPending}
          size="sm"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}