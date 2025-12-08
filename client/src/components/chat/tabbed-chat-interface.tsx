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

// Color resolution function that prioritizes embed parameters over UI Designer theme
function resolveColors() {
  // Get CSS variables from the embed parameters (these take priority)
  const embedPrimaryColor = getComputedStyle(document.documentElement).getPropertyValue('--chat-primary-color').trim();
  const embedBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--chat-background').trim();
  const embedTextColor = getComputedStyle(document.documentElement).getPropertyValue('--chat-text').trim();

  // Helper function to check if a color value is valid (not empty and not just fallback CSS var)
  const isValidColor = (color: string) => {
    return color && color !== '' && !color.startsWith('var(--') && color !== 'var(--primary)' && color !== 'var(--background)' && color !== 'var(--foreground)';
  };


  // Resolve final colors with embed parameters taking priority
  const resolvedColors = {
    primaryColor: isValidColor(embedPrimaryColor) ? embedPrimaryColor : 'var(--primary)',
    backgroundColor: isValidColor(embedBackgroundColor) ? embedBackgroundColor : 'var(--background)',
    textColor: isValidColor(embedTextColor) ? embedTextColor : 'var(--foreground)'
  };

  return resolvedColors;
}

interface TabbedChatInterfaceProps {
  sessionId: string;
  isMobile: boolean;
  isPreloaded?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
  chatbotConfigId?: number;
  chatbotConfig?: any;
  onSessionInitialize?: () => void; // Callback for session initialization
  forceInitialize?: boolean; // Force session initialization
}

export default function TabbedChatInterface({
  sessionId,
  isMobile,
  isPreloaded = false,
  onClose,
  isEmbedded = false,
  chatbotConfigId,
  chatbotConfig,
  onSessionInitialize,
  forceInitialize = false
}: TabbedChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const streamingBubblesRef = useRef<any[]>([]);
  const prevMessageCountRef = useRef(0);
  const queryClient = useQueryClient();

  const {
    messages,
    sendMessage,
    sendStreamingMessage,
    selectOption,
    initializeSession,
    isLoading,
    isTyping: chatIsTyping,
    isSessionLoading,
    readOnlyMode,
    limitExceededInfo,
  } = useChat(sessionId, chatbotConfigId);

  // Initialize session when component mounts if needed
  useEffect(() => {
    if (forceInitialize || (isEmbedded && !onSessionInitialize)) {
      // For test pages or embedded widgets, initialize immediately
      initializeSession();
    } else if (onSessionInitialize) {
      // For mobile chat, call the provided initialization function
      onSessionInitialize();
    }
  }, [forceInitialize, isEmbedded, onSessionInitialize, initializeSession]);


  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactError, setContactError] = useState("");
  const [contactFieldErrors, setContactFieldErrors] = useState({
    name: "",
    email: "",
    message: ""
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const isUserNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;

    const threshold = 200; // pixels from bottom - more generous
    const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
    return isNearBottom;
  };

  useEffect(() => {
    const currentMessageCount = messages?.length || 0;
    const hasNewMessages = currentMessageCount > prevMessageCountRef.current;

    if (hasNewMessages) {
      // Always scroll if:
      // 1. This is the first message
      // 2. We're currently streaming (multiple bubbles in same response)
      // 3. User is near bottom
      const shouldScroll = 
        prevMessageCountRef.current === 0 || 
        isStreaming || 
        isUserNearBottom();

      if (shouldScroll) {
        // Longer delay to ensure DOM is fully updated
        setTimeout(scrollToBottom, 150);
      }
    }

    prevMessageCountRef.current = currentMessageCount;
  }, [messages, isStreaming]);

  // Only auto-switch to chat tab when starting a new conversation, not when manually switching tabs
  // This effect is removed to allow free navigation between tabs

  const handleSendMessage = async (inputMessage: string, payload?: any) => {
    const messageText =
      typeof inputMessage === "string"
        ? inputMessage
        : String(inputMessage || "");
    if (!messageText.trim() || isLoading || isStreaming || readOnlyMode) return;

    setInputMessage("");
    setIsStreaming(true);
    streamingBubblesRef.current = [];

    // Switch to chat tab when sending a message
    setActiveTab("chat");

    // Force scroll to bottom when user sends a message
    setTimeout(scrollToBottom, 50);

    try {
      await sendStreamingMessage(
        messageText,
        // onBubbleReceived: Add each complete bubble directly to main messages
        (message: Message) => {
          // Mark as follow-up if this isn't the first bubble in this streaming sequence
          const isFollowUp = streamingBubblesRef.current.length > 0;
          const bubbleWithFlag = {
            ...message,
            metadata: {
              ...(message.metadata && typeof message.metadata === 'object' ? message.metadata : {}),
              isFollowUp,
              isStreaming: false, // Mark as permanent message
            },
          };

          // Add bubble directly to main messages query cache
          queryClient.setQueryData(
            ["/api/chat", sessionId, "messages"],
            (old: any) => {
              if (!old) return { messages: [bubbleWithFlag] };
              return { messages: [...old.messages, bubbleWithFlag] };
            },
          );

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
        },
      );
    } catch (error) {
      setIsStreaming(false);
      streamingBubblesRef.current = [];
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  const validateContactForm = () => {
    const errors = { name: "", email: "", message: "" };
    let isValid = true;

    // Name validation
    if (!contactForm.name.trim()) {
      errors.name = "Name is required";
      isValid = false;
    } else if (contactForm.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
      isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactForm.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!emailRegex.test(contactForm.email.trim())) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }

    // Message validation
    if (!contactForm.message.trim()) {
      errors.message = "Message is required";
      isValid = false;
    } else if (contactForm.message.trim().length < 10) {
      errors.message = "Message must be at least 10 characters";
      isValid = false;
    } else if (contactForm.message.trim().length > 1000) {
      errors.message = "Message must be less than 1000 characters";
      isValid = false;
    }

    setContactFieldErrors(errors);
    return isValid;
  };

  const isContactFormValid = () => {
    return contactForm.name.trim().length >= 2 &&
           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email.trim()) &&
           contactForm.message.trim().length >= 10 &&
           contactForm.message.trim().length <= 1000;
  };

  const handleContactFormSubmit = async () => {
    setContactError("");

    if (!validateContactForm()) {
      return;
    }

    setIsSubmittingContact(true);
    try {
      const response = await fetch(`/api/chat/${sessionId}/submit-form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formData: [
            { id: 'name', label: 'Name', value: contactForm.name.trim() },
            { id: 'email', label: 'Email', value: contactForm.email.trim() },
            { id: 'message', label: 'Message', value: contactForm.message.trim() }
          ],
          formTitle: 'Contact Request - Message Limit Exceeded'
        })
      });

      if (response.ok) {
        setContactSubmitted(true);
        setContactForm({ name: "", email: "", message: "" });
        setContactFieldErrors({ name: "", email: "", message: "" });
        // Auto-hide success message after 10 seconds
        setTimeout(() => setContactSubmitted(false), 10000);
      } else {
        const errorData = await response.text();
        setContactError("Failed to send message. Please try again.");
      }
    } catch (error) {
      setContactError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const handleOptionSelect = async (
    optionId: string,
    payload?: any,
    optionText?: string,
  ) => {
    if (isLoading || isStreaming || readOnlyMode) return;



    try {
      // First, record the option selection in the backend (this updates survey sessions)
      await selectOption(optionId, payload, optionText);

      // Then trigger streaming response with the updated survey context
      const displayText = optionText || optionId;
      const contextMessage =
        `User selected option "${optionId}"` +
        (payload !== undefined && payload !== null
          ? ` with payload: ${JSON.stringify(payload)}`
          : "") +
        ". Provide a helpful response.";

      setIsStreaming(true);
      streamingBubblesRef.current = [];

      await sendStreamingMessage(
        displayText, // Send displayText as the actual message content
        // onBubbleReceived: Add each complete bubble directly to main messages
        (message: Message) => {
          // Mark as follow-up if this isn't the first bubble in this streaming sequence
          const isFollowUp = streamingBubblesRef.current.length > 0;
          const bubbleWithFlag = {
            ...message,
            metadata: {
              ...(message.metadata && typeof message.metadata === 'object' ? message.metadata : {}),
              isFollowUp,
              isStreaming: false, // Mark as permanent message
            },
          };

          // Add bubble directly to main messages query cache
          queryClient.setQueryData(
            ["/api/chat", sessionId, "messages"],
            (old: any) => {
              if (!old) return { messages: [bubbleWithFlag] };
              return { messages: [...old.messages, bubbleWithFlag] };
            },
          );

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
        contextMessage,
      );
    } catch (error) {
      setIsStreaming(false);
      streamingBubblesRef.current = [];
      console.error("Option select error:", error);
    }
  };

  const handleQuickReply = async (reply: string) => {
    if (isLoading || isStreaming || readOnlyMode) return;

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
              ...(message.metadata && typeof message.metadata === 'object' ? message.metadata : {}),
              isFollowUp,
              isStreaming: false, // Mark as permanent message
            },
          };

          // Add bubble directly to main messages query cache
          queryClient.setQueryData(
            ["/api/chat", sessionId, "messages"],
            (old: any) => {
              if (!old) return { messages: [bubbleWithFlag] };
              return { messages: [...old.messages, bubbleWithFlag] };
            },
          );

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
        },
      );
    } catch (error) {
      setIsStreaming(false);
      streamingBubblesRef.current = [];
    }
  };

  const handleStartChat = async (
    topic: string,
    messageOrPayload?: string | any,
  ) => {
    // Switch to chat tab
    setActiveTab("chat");

    // Check if this is a survey action with separate display/internal messages
    if (
      typeof messageOrPayload === "object" &&
      messageOrPayload?.actionType === "survey"
    ) {
      // Handle survey action with clean display message and internal message with surveyId
      const displayMessage = messageOrPayload.displayMessage;
      const internalMessage = messageOrPayload.internalMessage;
      setInputMessage("");

      // Small delay to ensure the tab switch and input update, then send
      setTimeout(() => {
        setIsStreaming(true);
        streamingBubblesRef.current = [];

        sendStreamingMessage(
          displayMessage, // Show clean message in chat
          // onBubbleReceived: Add each complete bubble directly to main messages
          (receivedMessage: Message) => {
            // Mark as follow-up if this isn't the first bubble in this streaming sequence
            const isFollowUp = streamingBubblesRef.current.length > 0;
            const bubbleWithFlag = {
              ...receivedMessage,
              metadata: {
                ...(receivedMessage.metadata && typeof receivedMessage.metadata === 'object' ? receivedMessage.metadata : {}),
                isFollowUp,
                isStreaming: false, // Mark as permanent message
              },
            };

            // Add bubble directly to main messages query cache
            queryClient.setQueryData(
              ["/api/chat", sessionId, "messages"],
              (old: any) => {
                if (!old) return { messages: [bubbleWithFlag] };
                return { messages: [...old.messages, bubbleWithFlag] };
              },
            );

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
          },
          internalMessage, // Send internal message with surveyId to backend
        ).catch((error) => {
          setIsStreaming(false);
          streamingBubblesRef.current = [];
          setInputMessage(""); // Clear input on error
          console.error("Start chat error:", error);
        });
      }, 100);
    } else if (
      typeof messageOrPayload === "object" &&
      messageOrPayload?.action === "take_assessment"
    ) {
      // Handle legacy survey action - start survey flow (fallback)
      const surveyMessage = `${topic}`;
      setInputMessage("");

      // Small delay to ensure the tab switch and input update, then send
      setTimeout(() => {
        setIsStreaming(true);
        streamingBubblesRef.current = [];

        sendStreamingMessage(
          surveyMessage,
          // onBubbleReceived: Add each complete bubble directly to main messages
          (receivedMessage: Message) => {
            // Mark as follow-up if this isn't the first bubble in this streaming sequence
            const isFollowUp = streamingBubblesRef.current.length > 0;
            const bubbleWithFlag = {
              ...receivedMessage,
              metadata: {
                ...(receivedMessage.metadata && typeof receivedMessage.metadata === 'object' ? receivedMessage.metadata : {}),
                isFollowUp,
                isStreaming: false, // Mark as permanent message
              },
            };

            // Add bubble directly to main messages query cache
            queryClient.setQueryData(
              ["/api/chat", sessionId, "messages"],
              (old: any) => {
                if (!old) return { messages: [bubbleWithFlag] };
                return { messages: [...old.messages, bubbleWithFlag] };
              },
            );

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
          },
        ).catch((error) => {
          setIsStreaming(false);
          streamingBubblesRef.current = [];
          setInputMessage(""); // Clear input on error
          console.error("Start chat error:", error);
        });
      }, 100);
    } else if (typeof messageOrPayload === "string" && messageOrPayload) {
      // If a specific message string is provided, send it directly without showing in input
      setIsStreaming(true);
      streamingBubblesRef.current = [];

      sendStreamingMessage(
        messageOrPayload,
        // onBubbleReceived: Add each complete bubble directly to main messages
        (receivedMessage: Message) => {
          // Mark as follow-up if this isn't the first bubble in this streaming sequence
          const isFollowUp = streamingBubblesRef.current.length > 0;
          const bubbleWithFlag = {
            ...receivedMessage,
            metadata: {
              ...(receivedMessage.metadata && typeof receivedMessage.metadata === 'object' ? receivedMessage.metadata : {}),
              isFollowUp,
              isStreaming: false, // Mark as permanent message
            },
          };

          // Add bubble directly to main messages query cache
          queryClient.setQueryData(
            ["/api/chat", sessionId, "messages"],
            (old: any) => {
              if (!old) return { messages: [bubbleWithFlag] };
              return { messages: [...old.messages, bubbleWithFlag] };
            },
          );

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
          console.error("Start chat streaming error:", error);
        },
      ).catch((error) => {
        setIsStreaming(false);
        streamingBubblesRef.current = [];
        console.error("Start chat error:", error);
      });
    }
  };

  // Resolve colors with embed parameters taking priority
  const colors = resolveColors();

  if (isSessionLoading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: colors.backgroundColor, color: colors.textColor }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.primaryColor }}></div>
      </div>
    );
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className={`flex flex-col h-full ${isEmbedded ? "embedded-tabs" : ""}`}
    >
      {/* Tab Content - takes remaining space above navigation */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <TabsContent
          value="home"
          className="flex-1 m-0 p-0 flex flex-col overflow-hidden"
          style={{
            position: "static",
            width: "100%",
            background: "transparent",
            border: "none",
            padding: 0,
            margin: 0,
          }}
        >
          <HomeTab
            onStartChat={handleStartChat}
            isMobile={isMobile}
            isPreloaded={isPreloaded}
            chatbotConfig={chatbotConfig}
          />
        </TabsContent>

        <TabsContent
          value="chat"
          className="flex-1 m-0 p-0 flex flex-col overflow-hidden"
          style={{
            position: "static",
            width: "100%",
            background: colors.backgroundColor,
            border: "none",
            padding: 0,
            margin: 0,
            color: colors.textColor,
          }}
        >
          {/* Messages area - takes remaining space above input */}
          <div
            ref={messagesContainerRef}
            className={`flex-1 overflow-y-auto p-4 space-y-4 min-h-0 ${isEmbedded ? "embedded-messages-area" : ""}`}
            style={{
              backgroundColor: colors.backgroundColor,
              color: colors.textColor,
            }}
          >
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center" style={{ color: colors.textColor, opacity: 0.7 }}>
                  <MessageCircle className="h-12 w-12 mx-auto mb-4" style={{ color: colors.textColor, opacity: 0.3 }} />
                  <p className="text-sm">{chatbotConfig?.welcomeMessage || "Start typing to begin the conversation"}</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <MessageBubble
                  key={`message-${message.id}-${index}`}
                  message={{
                    ...message,
                    id: typeof message.id === 'string' ? parseInt((message.id as string).replace('initial-', ''), 10) || 0 : message.id,
                    createdAt: typeof message.createdAt === 'string' ? new Date(message.createdAt) : message.createdAt,
                    metadata: message.metadata || {},
                    sender: message.sender as 'user' | 'assistant' | 'bot',
                    messageType: message.messageType as 'text' | 'card' | 'menu' | 'form' | 'quickReplies' | 'image' | 'multiselect_menu' | 'rating' | 'form_submission' | 'system'
                  }}
                  onOptionSelect={handleOptionSelect}
                  onQuickReply={handleQuickReply}
                  chatbotConfig={chatbotConfig}
                  sessionId={sessionId}
                />
              ))
            )}

            {(chatIsTyping || isStreaming) && (
              <TypingIndicator chatbotConfig={chatbotConfig} />
            )}

            {/* Limit exceeded message */}
            {readOnlyMode && limitExceededInfo && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                      {limitExceededInfo.message}
                    </p>
                    {limitExceededInfo.showContactForm && !contactSubmitted && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                          Leave your contact details:
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <input
                              type="text"
                              placeholder="Your name"
                              value={contactForm.name}
                              onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                              disabled={isSubmittingContact}
                              maxLength={50}
                              className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 dark:bg-orange-900/30 ${
                                contactFieldErrors.name 
                                  ? 'border-red-400 dark:border-red-600 focus:ring-red-500' 
                                  : 'border-orange-300 dark:border-orange-700 focus:ring-orange-500'
                              }`}
                            />
                            {contactFieldErrors.name && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{contactFieldErrors.name}</p>
                            )}
                          </div>

                          <div>
                            <input
                              type="email"
                              placeholder="Your email address"
                              value={contactForm.email}
                              onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                              disabled={isSubmittingContact}
                              maxLength={100}
                              className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 dark:bg-orange-900/30 ${
                                contactFieldErrors.email 
                                  ? 'border-red-400 dark:border-red-600 focus:ring-red-500' 
                                  : 'border-orange-300 dark:border-orange-700 focus:ring-orange-500'
                              }`}
                            />
                            {contactFieldErrors.email && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{contactFieldErrors.email}</p>
                            )}
                          </div>

                          <div>
                            <textarea
                              placeholder="Your message (10-1000 characters)"
                              value={contactForm.message}
                              onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                              disabled={isSubmittingContact}
                              rows={3}
                              maxLength={1000}
                              className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 dark:bg-orange-900/30 resize-none ${
                                contactFieldErrors.message 
                                  ? 'border-red-400 dark:border-red-600 focus:ring-red-500' 
                                  : 'border-orange-300 dark:border-orange-700 focus:ring-orange-500'
                              }`}
                            />
                            {contactFieldErrors.message && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{contactFieldErrors.message}</p>
                            )}
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                              {contactForm.message.length}/1000 characters
                            </p>
                          </div>

                          {contactError && (
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md">
                              <p className="text-xs text-red-800 dark:text-red-200">{contactError}</p>
                            </div>
                          )}

                          <button 
                            className="w-full px-4 py-2 text-sm bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors flex items-center justify-center"
                            onClick={handleContactFormSubmit}
                            disabled={isSubmittingContact || !isContactFormValid()}
                          >
                            {isSubmittingContact && <MessageCircle className="w-4 h-4 mr-2 animate-spin" />}
                            {isSubmittingContact ? 'Sending...' : 'Send Contact Request'}
                          </button>
                        </div>
                      </div>
                    )}
                    {limitExceededInfo.showContactForm && contactSubmitted && (
                      <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-md">
                        <div className="flex items-center space-x-2">
                          <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <p className="text-sm text-green-800 dark:text-green-200">
                            Thank you! Your message has been sent successfully. We'll get back to you soon.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area - fixed height */}
          <div 
            className="border-t px-4 py-1 flex-shrink-0"
            style={{
              backgroundColor: colors.backgroundColor,
              borderColor: colors.textColor + '30', // Add transparency to border
            }}
          >
            <div className="flex items-center space-x-3">
              <button 
                className="transition-colors"
                style={{ 
                  color: colors.textColor + '80', // Semi-transparent
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = colors.textColor}
                onMouseLeave={(e) => e.currentTarget.style.color = colors.textColor + '80'}
              >

              </button>

              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder={readOnlyMode ? "Chat temporarily unavailable" : ""}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="send-input rounded-full pr-12 focus:ring-2 focus:border-transparent"
                  style={{
                    backgroundColor: colors.backgroundColor,
                    color: colors.textColor,
                    borderColor: colors.textColor + '40',
                    '--tw-ring-color': colors.primaryColor,
                    fontSize: '14px'
                  } as React.CSSProperties}
                  disabled={isLoading || readOnlyMode}
                />
                <Button
                  onClick={() => handleSendMessage(inputMessage)}
                  disabled={!inputMessage.trim() || isLoading || readOnlyMode}
                  size="sm"
                  className="send-button absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full h-8 w-8 p-0"
                  style={{
                    backgroundColor: colors.primaryColor,
                    borderColor: colors.primaryColor,
                    color: 'white'
                  }}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </div>

      {/* Tab Navigation - at bottom */}
      <TabsList 
        className="grid w-full grid-cols-2 h-12 p-0.5"
        style={{
          backgroundColor: colors.backgroundColor,
        }}
      >
        <TabsTrigger
          value="home"
          className="flex items-center gap-2 h-10 py-2 rounded-lg border-2 border-transparent"
          style={{
            color: activeTab === 'home' ? colors.primaryColor : colors.textColor + '80',
            borderColor: activeTab === 'home' ? colors.primaryColor : 'transparent',
            backgroundColor: activeTab === 'home' ? colors.primaryColor + '10' : 'transparent',
          }}
        >
          <Home className="h-4 w-4" />
          <span className={isMobile ? "hidden sm:inline" : ""}></span>
        </TabsTrigger>
        <TabsTrigger
          value="chat"
          className="flex items-center gap-2 h-10 py-2 rounded-lg border-2 border-transparent"
          style={{
            color: activeTab === 'chat' ? colors.primaryColor : colors.textColor + '80',
            borderColor: activeTab === 'chat' ? colors.primaryColor : 'transparent',
            backgroundColor: activeTab === 'chat' ? colors.primaryColor + '10' : 'transparent',
          }}
        >
          <MessageCircle className="h-4 w-4" />
          <span className={isMobile ? "hidden sm:inline" : ""}></span>
          {messages.length > 0 && (
            <span 
              className="text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center"
              style={{
                backgroundColor: colors.primaryColor,
                color: 'white'
              }}
            >
              {messages.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}