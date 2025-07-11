import { useState, useEffect, useRef } from "react";
import { Send, Paperclip, Home, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MessageBubble from "./message-bubble";
import TypingIndicator from "./typing-indicator";
import HomeTab from "./home-tab";
import { useChat } from "@/hooks/use-chat";
import { Message } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";

interface TabbedChatInterfaceProps {
  sessionId: string;
  isMobile: boolean;
  isPreloaded?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export default function TabbedChatInterface({ 
  sessionId, 
  isMobile,
  isPreloaded = false,
  onClose,
  isEmbedded = false
}: TabbedChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingBubblesRef = useRef<any[]>([]);
  const queryClient = useQueryClient();

  const { 
    messages, 
    sendMessage,
    sendStreamingMessage, 
    selectOption, 
    isLoading,
    isSessionLoading 
  } = useChat(sessionId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Only auto-switch to chat tab when starting a new conversation, not when manually switching tabs
  // This effect is removed to allow free navigation between tabs

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || isStreaming) return;

    const message = inputMessage.trim();
    setInputMessage("");
    setIsStreaming(true);
    streamingBubblesRef.current = [];

    // Switch to chat tab when sending a message
    setActiveTab("chat");

    try {
      await sendStreamingMessage(
        message,
        // onBubbleReceived: Add each complete bubble directly to main messages
        (message: Message) => {
          // Mark as follow-up if this isn't the first bubble in this streaming sequence
          const isFollowUp = streamingBubblesRef.current.length > 0;
          const bubbleWithFlag = {
            ...message,
            metadata: {
              ...message.metadata,
              isFollowUp,
              isStreaming: false // Mark as permanent message
            }
          };

          // Add bubble directly to main messages query cache
          queryClient.setQueryData(['/api/chat', sessionId, 'messages'], (old: any) => {
            if (!old) return { messages: [bubbleWithFlag] };
            return { messages: [...old.messages, bubbleWithFlag] };
          });

          // Keep track of streaming bubbles for counting
          streamingBubblesRef.current.push(bubbleWithFlag);
        },
        // onAllComplete: Streaming finished, just set streaming state to false
        (messages: Message[]) => {
          setIsStreaming(false);
          // Clear the tracking ref since streaming is complete
          streamingBubblesRef.current = [];
        },
        // onError: Handle errors
        (error: string) => {
          setIsStreaming(false);
          streamingBubblesRef.current = [];
          console.error("Streaming error:", error);
        }
      );
    } catch (error) {
      setIsStreaming(false);
      streamingBubblesRef.current = [];
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleOptionSelect = async (optionId: string, payload?: any, optionText?: string) => {
    if (isLoading || isStreaming) return;

    // Create the context message for option selection
    const displayText = optionText || optionId;
    const contextMessage = `User selected option "${optionId}" with payload: ${JSON.stringify(payload)}. Provide a helpful response.`;

    setIsStreaming(true);
    streamingBubblesRef.current = [];

    try {
      await sendStreamingMessage(
        displayText, // Send displayText as the actual message content
        // onBubbleReceived: Add each complete bubble directly to main messages
        (message: Message) => {
          // Mark as follow-up if this isn't the first bubble in this streaming sequence
          const isFollowUp = streamingBubblesRef.current.length > 0;
          const bubbleWithFlag = {
            ...message,
            metadata: {
              ...message.metadata,
              isFollowUp,
              isStreaming: false // Mark as permanent message
            }
          };

          // Add bubble directly to main messages query cache
          queryClient.setQueryData(['/api/chat', sessionId, 'messages'], (old: any) => {
            if (!old) return { messages: [bubbleWithFlag] };
            return { messages: [...old.messages, bubbleWithFlag] };
          });

          // Keep track of streaming bubbles for counting
          streamingBubblesRef.current.push(bubbleWithFlag);
        },
        // onAllComplete: Streaming finished, just set streaming state to false
        (messages: Message[]) => {
          setIsStreaming(false);
          // Clear the tracking ref since streaming is complete
          streamingBubblesRef.current = [];
        },
        // onError: Handle errors
        (error: string) => {
          setIsStreaming(false);
          streamingBubblesRef.current = [];
          console.error("Option select streaming error:", error);
        },
        // Pass contextMessage as the internal message for AI processing
        contextMessage
      );
    } catch (error) {
      setIsStreaming(false);
      streamingBubblesRef.current = [];
      console.error("Option select error:", error);
    }
  };

  const handleQuickReply = async (reply: string) => {
    if (isLoading || isStreaming) return;

    setIsStreaming(true);
    streamingBubblesRef.current = [];

    try {
      await sendStreamingMessage(
        reply,
        // onBubbleReceived: Add each complete bubble directly to main messages
        (message: Message) => {
          // Mark as follow-up if this isn't the first bubble in this streaming sequence
          const isFollowUp = streamingBubblesRef.current.length > 0;
          const bubbleWithFlag = {
            ...message,
            metadata: {
              ...message.metadata,
              isFollowUp,
              isStreaming: false // Mark as permanent message
            }
          };

          // Add bubble directly to main messages query cache
          queryClient.setQueryData(['/api/chat', sessionId, 'messages'], (old: any) => {
            if (!old) return { messages: [bubbleWithFlag] };
            return { messages: [...old.messages, bubbleWithFlag] };
          });

          // Keep track of streaming bubbles for counting
          streamingBubblesRef.current.push(bubbleWithFlag);
        },
        // onAllComplete: Streaming finished, just set streaming state to false
        (messages: Message[]) => {
          setIsStreaming(false);
          // Clear the tracking ref since streaming is complete
          streamingBubblesRef.current = [];
        },
        // onError: Handle errors
        (error: string) => {
          setIsStreaming(false);
          streamingBubblesRef.current = [];
          console.error("Quick reply streaming error:", error);
        }
      );
    } catch (error) {
      setIsStreaming(false);
      streamingBubblesRef.current = [];
    }
  };

  const handleStartChat = async (topic: string, message?: string) => {
    // Switch to chat tab
    setActiveTab("chat");

    if (message) {
      // If a specific message is provided, send it
      setInputMessage(message);

      // Small delay to ensure the tab switch and input update, then send
      setTimeout(() => {
        setIsStreaming(true);
        streamingBubblesRef.current = [];

        sendStreamingMessage(
          message,
          // onBubbleReceived: Add each complete bubble directly to main messages
          (receivedMessage: Message) => {
            // Mark as follow-up if this isn't the first bubble in this streaming sequence
            const isFollowUp = streamingBubblesRef.current.length > 0;
            const bubbleWithFlag = {
              ...receivedMessage,
              metadata: {
                ...receivedMessage.metadata,
                isFollowUp,
                isStreaming: false // Mark as permanent message
              }
            };

            // Add bubble directly to main messages query cache
            queryClient.setQueryData(['/api/chat', sessionId, 'messages'], (old: any) => {
              if (!old) return { messages: [bubbleWithFlag] };
              return { messages: [...old.messages, bubbleWithFlag] };
            });

            // Keep track of streaming bubbles for counting
            streamingBubblesRef.current.push(bubbleWithFlag);
          },
          // onAllComplete: Streaming finished, just set streaming state to false
          (messages: Message[]) => {
            setIsStreaming(false);
            // Clear the tracking ref since streaming is complete
            streamingBubblesRef.current = [];
            setInputMessage(""); // Clear input after sending
          },
          // onError: Handle errors
          (error: string) => {
            setIsStreaming(false);
            streamingBubblesRef.current = [];
            setInputMessage(""); // Clear input on error
            console.error("Start chat streaming error:", error);
          }
        ).catch(error => {
          setIsStreaming(false);
          streamingBubblesRef.current = [];
          setInputMessage(""); // Clear input on error
          console.error("Start chat error:", error);
        });
      }, 100);
    }
  };

  if (isSessionLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className={`flex flex-col h-full ${isEmbedded ? 'embedded-tabs' : ''}`}>
      {/* Tab Content - takes remaining space above navigation */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <TabsContent 
          value="home" 
          className="flex-1 m-0 p-0 flex flex-col overflow-hidden"
          style={{ 
            position: 'static',
            width: '100%',
            background: 'transparent',
            border: 'none',
            padding: 0,
            margin: 0
          }}
        >
          <HomeTab 
              onStartChat={handleStartChat} 
              isMobile={isMobile}
              isPreloaded={isPreloaded}
            />
        </TabsContent>

        <TabsContent 
          value="chat" 
          className="flex-1 m-0 p-0 flex flex-col overflow-hidden"
          style={{ 
            position: 'static',
            width: '100%',
            background: 'transparent',
            border: 'none',
            padding: 0,
            margin: 0
          }}
        >
          {/* Messages area - takes remaining space above input */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 min-h-0 ${isEmbedded ? 'embedded-messages-area' : ''}`}
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="font-medium mb-2">No messages yet</h3>
                  <p className="text-sm">Start a conversation or go to Home to choose a topic</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onOptionSelect={handleOptionSelect}
                  onQuickReply={handleQuickReply}
                />
              ))
            )}

            {(isTyping || isStreaming) && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area - fixed height */}
          <div className="border-t border-neutral-200 p-4 bg-white flex-shrink-0">
            <div className="flex items-center space-x-3">
              <button className="text-neutral-500 hover:text-neutral-700 transition-colors">
                <Paperclip className="h-5 w-5" />
              </button>

              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="rounded-full pr-12 border-neutral-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full h-8 w-8 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick replies */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickReply("Thank you")}
                className="rounded-full text-xs px-3 py-1 h-auto"
                disabled={isLoading}
              >
                Thank you
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickReply("I need more help")}
                className="rounded-full text-xs px-3 py-1 h-auto"
                disabled={isLoading}
              >
                I need more help
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickReply("Contact human agent")}
                className="rounded-full text-xs px-3 py-1 h-auto"
                disabled={isLoading}
              >
                Contact agent
              </Button>
            </div>
          </div>
        </TabsContent>
      </div>

      {/* Tab Navigation - fixed at bottom */}
      <div className="border-t border-neutral-200 bg-white flex-shrink-0">
        <TabsList className="grid w-full grid-cols-2 h-14 bg-transparent p-1">
          <TabsTrigger 
            value="home" 
            className="flex items-center gap-2 h-full rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5"
          >
            <Home className="h-4 w-4" />
            <span className={isMobile ? "hidden sm:inline" : ""}>Home</span>
          </TabsTrigger>
          <TabsTrigger 
            value="chat" 
            className="flex items-center gap-2 h-full rounded-lg border-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5"
          >
            <MessageCircle className="h-4 w-4" />
            <span className={isMobile ? "hidden sm:inline" : ""}>Chat</span>
            {messages.length > 0 && (
              <span className="bg-primary text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                {messages.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </div>
    </Tabs>
  );
}