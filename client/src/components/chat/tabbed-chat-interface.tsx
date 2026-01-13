import { useState, useEffect, useRef, useMemo, useCallback, startTransition, memo } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import HomeTab from "./home-tab";
import { ChatTab } from "./chat-tab";
import { TabNavigation } from "./tab-navigation";
import { useChat } from "@/hooks/use-chat";
import { Message } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";
import { computeToneAdjustedColor, resolveThemeColors } from "./color-utils";
import { useContactForm } from "@/hooks/useContactForm";
import { useStreamingMessage } from "@/hooks/useStreamingMessage";


/**
 * TabbedChatInterface - Main chat widget component
 * 
 * Manages:
 * - Two-tab UI (Home and Chat)
 * - Message streaming and display
 * - User interactions (sending messages, selecting options, quick replies)
 * - Contact form for message limit exceeded scenarios
 * - Theme and color management
 * 
 * Refactored to use custom hooks:
 * - useStreamingMessage: handles streaming message logic
 * - useContactForm: manages contact form state and validation
 */

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

const TabbedChatInterface = memo(({
  sessionId,
  isMobile,
  isPreloaded = false,
  onClose,
  isEmbedded = false,
  chatbotConfigId,
  chatbotConfig,
  onSessionInitialize,
  forceInitialize = false
}: TabbedChatInterfaceProps) => {
  // UI State
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  
  // Refs for internal state management
  const isStreamingRef = useRef(false);
  const prevMessageCountRef = useRef(0);
  const renderedMessageIdsRef = useRef<Set<string | number>>(new Set());
  const hasLoadedContentRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const queryClient = useQueryClient();
  
  // Custom hooks
  const { streamingBubblesRef, getStreamingHandlers } = useStreamingMessage({
    sessionId,
    isStreaming,
    readOnlyMode: false,
    onStreamEnd: () => setIsStreaming(false),
    onError: (error) => {
      setIsStreaming(false);
      console.error("Streaming error:", error);
    },
  });
  
  const {
    contactForm,
    setContactForm,
    contactFieldErrors,
    contactError,
    isSubmittingContact,
    contactSubmitted,
    setContactSubmitted,
    handleContactFormSubmit,
    isContactFormValid,
  } = useContactForm(sessionId);
  
  const {
    messages,
    sendMessage,
    sendStreamingMessage,
    selectOption,
    initializeSession,
    isLoading,
    isTyping: chatIsTyping,
    isSessionLoading,
    session,
    readOnlyMode,
    limitExceededInfo,
  } = useChat(sessionId, chatbotConfigId);
  
  // Debug: Log when messages prop changes
  useEffect(() => {
    console.log('[TabbedChatInterface] Messages changed:', messages.length);
  }, [messages]);

  // DEBUG: Log every render with key state values
  console.log('[TabbedChatInterface RENDER]', {
    sessionId,
    isStreaming,
    activeTab,
    messagesCount: messages.length,
    timestamp: Date.now()
  });
  
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

  // Keep ref in sync with isStreaming state for use in memoized callbacks
  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  // Track if we've ever loaded content to prevent showing spinner on refetches
  useEffect(() => {
    if (messages.length > 0 || chatbotConfig) {
      hasLoadedContentRef.current = true;
    }
  }, [messages.length, chatbotConfig]);


  // Contact form state
  // Now managed by useContactForm hook above

  // Scroll functionality
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const isUserNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 200;
    const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
    return isNearBottom;
  };

  // Message handlers using streaming hooks
  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading || isStreaming || readOnlyMode) return;

    setInputMessage("");
    setIsStreaming(true);
    streamingBubblesRef.current = [];
    setActiveTab("chat");
    setTimeout(scrollToBottom, 50);

    const handlers = getStreamingHandlers();
    try {
      await sendStreamingMessage(messageText, handlers.onBubbleReceived, handlers.onAllComplete, handlers.onError);
    } catch (error) {
      setIsStreaming(false);
      streamingBubblesRef.current = [];
    }
  }, [isLoading, isStreaming, readOnlyMode, getStreamingHandlers, sendStreamingMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  }, [inputMessage, handleSendMessage]);

  const handleOptionSelect = useCallback(async (
    optionId: string,
    payload?: any,
    optionText?: string,
  ) => {
    console.log('[handleOptionSelect START]', { optionId, optionText, timestamp: Date.now() });
    
    if (readOnlyMode || isStreamingRef.current) return;

    try {
      console.log('[handleOptionSelect] Calling selectOption...', { timestamp: Date.now() });
      selectOption(optionId, payload, optionText);
      console.log('[handleOptionSelect] selectOption returned', { timestamp: Date.now() });
    } catch (selectError) {
      console.warn('[SURVEY] Failed to record option selection:', selectError);
    }

    console.log('[handleOptionSelect] Setting isStreaming=true', { timestamp: Date.now() });
    setIsStreaming(true);
    streamingBubblesRef.current = [];
    const displayText = optionText || optionId;
    const handlers = getStreamingHandlers();

    try {
      await sendStreamingMessage(displayText, handlers.onBubbleReceived, handlers.onAllComplete, handlers.onError);
    } catch (error) {
      setIsStreaming(false);
      streamingBubblesRef.current = [];
      console.error("Option select error:", error);
    }
  }, [readOnlyMode, selectOption, sendStreamingMessage, getStreamingHandlers]);

  const handleQuickReply = useCallback(async (reply: string) => {
    if (readOnlyMode || isStreamingRef.current) return;

    setIsStreaming(true);
    streamingBubblesRef.current = [];
    const handlers = getStreamingHandlers();

    try {
      await sendStreamingMessage(reply, handlers.onBubbleReceived, handlers.onAllComplete, handlers.onError);
    } catch (error) {
      setIsStreaming(false);
      streamingBubblesRef.current = [];
    }
  }, [readOnlyMode, sendStreamingMessage, getStreamingHandlers]);

  const handleStartChat = useCallback(async (
    topic: string,
    messageOrPayload?: string | any,
  ) => {
    setActiveTab("chat");
    const handlers = getStreamingHandlers();

    let messageToSend = topic;
    let internalMessage: any = undefined;

    // Handle survey action with separate display/internal messages
    if (typeof messageOrPayload === "object" && messageOrPayload?.actionType === "survey") {
      messageToSend = messageOrPayload.displayMessage;
      internalMessage = messageOrPayload.internalMessage;
    } else if (typeof messageOrPayload === "object" && messageOrPayload?.action === "take_assessment") {
      messageToSend = topic;
    } else if (typeof messageOrPayload === "string" && messageOrPayload) {
      messageToSend = messageOrPayload;
    }

    setInputMessage("");
    setIsStreaming(true);
    streamingBubblesRef.current = [];

    setTimeout(() => {
      sendStreamingMessage(messageToSend, handlers.onBubbleReceived, handlers.onAllComplete, handlers.onError, internalMessage)
        .catch((error) => {
          setIsStreaming(false);
          streamingBubblesRef.current = [];
          console.error("Start chat error:", error);
        });
    }, 100);
  }, [getStreamingHandlers, sendStreamingMessage]);

  // Resolve colors with embed parameters taking priority, then chatbot config
  const colors = resolveThemeColors(chatbotConfig);
  const inputBackground = computeToneAdjustedColor(
    colors.backgroundColor,
    colors.textColor,
    colors.botBubbleMode
  );

  // Memoize transformed messages to prevent unnecessary re-renders
  const transformedMessages = useMemo(() => {
    const transformed = messages.map((message, index) => {
      const stableId = message.id !== undefined && message.id !== null 
        ? (typeof message.id === 'string' ? parseInt((message.id as string).replace('initial-', ''), 10) || index : message.id)
        : `fallback-${index}-${message.content?.slice(0, 20) || 'empty'}`;
      
      const stableKey = `message-${stableId}`;
      const isNewMessage = !renderedMessageIdsRef.current.has(stableKey);
      
      if (isNewMessage) {
        renderedMessageIdsRef.current.add(stableKey);
      }
      
      return {
        ...message,
        id: stableId as number,
        _stableKey: stableKey,
        _isNew: isNewMessage,
        createdAt: typeof message.createdAt === 'string' ? new Date(message.createdAt) : message.createdAt,
        metadata: message.metadata || {},
        sender: message.sender as 'user' | 'assistant' | 'bot',
        messageType: message.messageType as 'text' | 'card' | 'menu' | 'form' | 'quickReplies' | 'image' | 'multiselect_menu' | 'rating' | 'form_submission' | 'system'
      };
    });
    return transformed;
  }, [messages]);

  // Only show loading spinner on very first load
  const shouldShowSpinner = isSessionLoading && !hasLoadedContentRef.current && messages.length === 0 && !session;
  
  if (shouldShowSpinner) {
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
          <ChatTab
            messages={transformedMessages}
            inputMessage={inputMessage}
            onInputChange={setInputMessage}
            onKeyPress={handleKeyPress}
            onSendMessage={handleSendMessage}
            onOptionSelect={handleOptionSelect}
            onQuickReply={handleQuickReply}
            chatIsTyping={chatIsTyping}
            isStreaming={isStreaming}
            isLoading={isLoading}
            readOnlyMode={readOnlyMode}
            limitExceededInfo={limitExceededInfo}
            chatbotConfig={chatbotConfig}
            sessionId={sessionId}
            colors={colors}
            inputBackground={inputBackground}
            isMobile={isMobile}
            isEmbedded={isEmbedded}
            contactForm={contactForm}
            setContactForm={setContactForm}
            contactFieldErrors={contactFieldErrors}
            contactError={contactError}
            isSubmittingContact={isSubmittingContact}
            contactSubmitted={contactSubmitted}
            onContactFormSubmit={handleContactFormSubmit}
            isContactFormValid={isContactFormValid}
          />
        </TabsContent>
      </div>

      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        messagesCount={messages.length}
        isMobile={isMobile}
        colors={colors}
      />
    </Tabs>
  );
});

TabbedChatInterface.displayName = 'TabbedChatInterface';

export default TabbedChatInterface;