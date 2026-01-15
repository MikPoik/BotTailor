/**
 * React hook for streaming and non-streaming chat API integration.
 *
 * Responsibilities:
 * - Manages chat session creation, message sending, streaming, and optimistic UI updates.
 * - Handles streaming contract (newline-delimited data: frames, JSON event shapes) and deduplication.
 * - Provides read-only/limit-exceeded state, session storage fallbacks, and error handling.
 *
 * Constraints & Edge Cases:
 * - Streaming contract must match server (see server/openai/streaming-handler.ts).
 * - Storage access is guarded for sandboxed embed hosts.
 * - Optimistic UI and streaming state must be coordinated for correct user experience.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Message, ChatSession } from "@shared/schema";
import { useChatSession } from "@/contexts/chat-session-context";

const chatDebug = () => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('chat_debug') === '1';
  } catch {
    return false;
  }
};

const logDebug = (...args: any[]) => {
  if (chatDebug()) {
    console.log('[CHAT_DEBUG]', ...args);
  }
};

export function useChat(sessionId: string, chatbotConfigId?: number) {
  const [isTyping, setIsTyping] = useState(false);
  const [readOnlyMode, setReadOnlyMode] = useState(false);
  const [limitExceededInfo, setLimitExceededInfo] = useState<{
    message: string;
    showContactForm: boolean;
    chatbotConfig?: any;
  } | null>(null);
  const queryClient = useQueryClient();
  const initializedSessionRef = useRef<string | null>(null);

  useEffect(() => {
    // Reset initialization guard when session changes
    initializedSessionRef.current = null;
  }, [sessionId]);

  // Safe sessionStorage access that handles sandboxed environments
  const safeSessionStorage = {
    getItem: (key: string): string | null => {
      try {
        return sessionStorage.getItem(key);
      } catch (error) {
        console.warn('sessionStorage not accessible, using session-based fallback');
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        sessionStorage.setItem(key, value);
      } catch (error) {
        console.warn('sessionStorage not accessible, skipping storage');
      }
    },
    removeItem: (key: string): void => {
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        console.warn('sessionStorage not accessible, skipping removal');
      }
    }
  };

  // Initialize session - only create when explicitly requested
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ['/api/chat/session', sessionId, chatbotConfigId],
    queryFn: async () => {
      logDebug('fetch session', { sessionId, chatbotConfigId });
      const response = await apiRequest('POST', '/api/chat/session', {
        sessionId,
        chatbotConfigId: chatbotConfigId || null
      });
      return response.json();
    },
    enabled: false, // Don't auto-create session on widget load
    staleTime: Infinity, // Session data is stable, never auto-refetch
    refetchOnWindowFocus: false, // Prevent refetch on iframe focus changes
    refetchOnMount: false, // Prevent refetch on component remounts
  });

  // Detect embedding modes
  const isEmbedDesign = typeof window !== 'undefined'
    ? Boolean((window as any).__EMBED_CONFIG__)
    : false;
  const isLegacyChatEmbed = typeof window !== 'undefined'
    ? Boolean((window as any).__CHAT_WIDGET_CONFIG__?.embedded)
    : false;
  const isEmbedded = isEmbedDesign || isLegacyChatEmbed;

  // Get messages
  const { data: messagesData, isLoading: isMessagesLoading, dataUpdatedAt } = useQuery({
    queryKey: ['/api/chat', sessionId, 'messages'],
    queryFn: async () => {
      // Use absolute URL when widget is embedded
      const config = typeof window !== 'undefined'
        ? (window as any).__CHAT_WIDGET_CONFIG__ || (window as any).__EMBED_CONFIG__
        : undefined;
      const baseUrl = config?.apiUrl || '';
      const url = `/api/chat/${sessionId}/messages`;
      const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

      logDebug('fetch messages', fullUrl);
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!sessionId && !!session,
    staleTime: Infinity, // Messages are managed via optimistic updates, never auto-refetch
    gcTime: Infinity, // Keep data in cache forever in embedded mode
    refetchOnWindowFocus: false, // Prevent refetch on iframe focus changes (causes flash)
    refetchOnMount: false, // Prevent refetch on component remounts
    refetchOnReconnect: false, // Prevent refetch on network reconnect
    refetchInterval: false, // Disable polling
    refetchIntervalInBackground: false,
    // Allow notifications for streaming updates in all embed modes
    // notifyOnChangeProps removed to enable real-time streaming bubble updates
    structuralSharing: true, // Re-enable structural sharing to maintain object references
    // placeholderData removed - it was preventing cache updates from showing during streaming
  });

  // Memoize filtered messages to prevent unnecessary re-renders
  const messages: Message[] = useMemo(() => {
    return (messagesData?.messages || [])
      .filter((msg: Message) => msg.messageType !== 'system'); // Filter out system messages from UI
  }, [messagesData?.messages]);

  // Check for existing limit exceeded state on page load
  useEffect(() => {
    const limitKey = `chat-limit-exceeded-${sessionId}`;
    const limitState = safeSessionStorage.getItem(limitKey);
    if (limitState) {
      try {
        const parsed = JSON.parse(limitState);
        if (parsed.exceeded) {
          setReadOnlyMode(true);
          setLimitExceededInfo({
            message: parsed.message,
            showContactForm: parsed.showContactForm,
            chatbotConfig: parsed.chatbotConfig
          });
        }
      } catch (error) {
        console.warn('Failed to parse limit state from sessionStorage:', error);
      }
    }
  }, [sessionId]);

  // Clear read-only state after a reasonable time (30 minutes) to allow recovery
  useEffect(() => {
    if (readOnlyMode) {
      const recoveryTimer = setTimeout(() => {
        const limitKey = `chat-limit-exceeded-${sessionId}`;
        safeSessionStorage.removeItem(limitKey);
        setReadOnlyMode(false);
        setLimitExceededInfo(null);

      }, 30 * 60 * 1000); // 30 minutes

      return () => clearTimeout(recoveryTimer);
    }
  }, [readOnlyMode, sessionId]);

  // Streaming message function with real-time bubble parsing
  const sendStreamingMessage = async (
    userDisplayText: string,
    onBubbleReceived?: (message: Message) => void,
    onAllComplete?: (messages: Message[]) => void,
    onError?: (error: string) => void,
    internalMessage?: string,
    skipOptimisticMessage?: boolean,
    options?: { manageCache?: boolean }
  ) => {
    const manageCache = options?.manageCache !== false;
    try {
      setIsTyping(true);
      logDebug('sendStreamingMessage start', { userDisplayText, sessionId, chatbotConfigId });

      // Add optimistic user message to messages array (unless skipped)
      if (!skipOptimisticMessage) {
        const optimisticUserMessage: Message = {
          id: Date.now(), // Use number for consistency with schema
          sessionId,
          content: userDisplayText,
          sender: 'user',
          messageType: 'text',
          metadata: { isOptimistic: true }, // Mark as optimistic for replacement
          createdAt: new Date(), // Use Date object for schema consistency
        };

        // Get current data without refetching to preserve optimistic updates

        queryClient.setQueryData(['/api/chat', sessionId, 'messages'], (old: any) => {
          if (!old) return { messages: [optimisticUserMessage] };
          return { messages: [...old.messages, optimisticUserMessage] };
        });
      }

      // Use absolute URL when widget is embedded (chat widget or new embed)
      const config = typeof window !== 'undefined'
        ? (window as any).__CHAT_WIDGET_CONFIG__ || (window as any).__EMBED_CONFIG__
        : undefined;
      const baseUrl = config?.apiUrl || '';
      const url = `/api/chat/${sessionId}/messages/stream`;
      const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: userDisplayText,
          messageType: 'text',
          internalMessage: internalMessage !== userDisplayText ? internalMessage : undefined,
          chatbotConfigId: chatbotConfigId
        }),
      });

      if (!response.ok) {
        logDebug('stream request failed', response.status);
        throw new Error('Stream request failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      console.log('[STREAM] Starting to read stream at:', new Date().toISOString());
      let buffer = ''; // Buffer for incomplete lines
      let chunkCount = 0;

      while (true) {
        const readStartTime = new Date().toISOString();
        const { done, value } = await reader.read();
        const readEndTime = new Date().toISOString();
        chunkCount++;
        console.log(`[STREAM CHUNK ${chunkCount}] Read at ${readStartTime}, received at ${readEndTime}, size: ${value?.length || 0} bytes`);
        if (done) {
          console.log('[STREAM] Stream reading complete at:', new Date().toISOString(), 'Total chunks:', chunkCount);
          break;
        }

        const chunk = decoder.decode(value);
        buffer += chunk;

      // Process complete lines from buffer
      const lines = buffer.split('\n');

      // Keep the last line in buffer if it doesn't end with newline
      // (it might be incomplete)
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonData = line.slice(6).trim();

            // Skip empty data lines
            if (!jsonData) continue;

            const data = JSON.parse(jsonData);

            if (data.type === 'bubble' && data.message) {
              const receiveTime = new Date().toISOString();
              console.log(`[STREAM] ${receiveTime} Received bubble:`, data.message.id, data.message.messageType);
              logDebug(`${receiveTime} stream bubble`, data.message.id);
              
              // Always append the bubble to cache for embed/widget
              queryClient.setQueryData(['/api/chat', sessionId, 'messages'], (old: any) => {
                const currentMessages = old?.messages || [];
                
                // Check if this message already exists by ID (deduplicate)
                const messageExists = currentMessages.some((m: Message) => m.id === data.message.id);
                if (messageExists) {
                  return old; // Don't modify if message already exists
                }
                
                // If this is a user message from server, remove optimistic user message
                let updatedMessages = [...currentMessages];
                if (data.message.sender === 'user') {
                  updatedMessages = updatedMessages.filter((m: Message) => 
                    !((m.metadata as any)?.isOptimistic && m.sender === 'user')
                  );
                }
                return { messages: [...updatedMessages, data.message] };
              });

              onBubbleReceived?.(data.message);
            } else if (data.type === 'complete') {
                logDebug('stream complete');
                setIsTyping(false);
                // Don't add messages again - they're already in cache from bubbles
                onAllComplete?.(data.messages);
              } else if (data.type === 'limit_exceeded') {
                setIsTyping(false);
                setReadOnlyMode(true);
                setLimitExceededInfo({
                  message: data.message,
                  showContactForm: data.showContactForm,
                  chatbotConfig: data.chatbotConfig,
                });
                // Store in sessionStorage for current session only
                safeSessionStorage.setItem(`chat-limit-exceeded-${sessionId}`, JSON.stringify({
                  exceeded: true,
                  message: data.message,
                  showContactForm: data.showContactForm
                }));
                onError?.(data.message);
              } else if (data.type === 'error') {
                setIsTyping(false);
                onError?.(data.message);
              } else if (data.type === 'end') {
                setIsTyping(false);
                break;
              } else if (data.type === "chatbot_inactive") {
                setIsTyping(false);
                setReadOnlyMode(true);
                setLimitExceededInfo({
                  message: data.message,
                  showContactForm: data.showContactForm,
                  chatbotConfig: data.chatbotConfig,
                });
                onError?.(data.message);
              }
            } catch (parseError) {
              // Silently skip unparseable lines (could be partial chunks)
            }
          }
        }
      }
    } catch (error) {
      setIsTyping(false);
      console.error('Streaming error:', error);
      logDebug('stream error', error);
      onError?.('Failed to send message');
    }
  };

  // Send message mutation (non-streaming fallback)
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Optimistically add user message to UI immediately
      const optimisticUserMessage = {
        id: Date.now(), // Temporary ID
        sessionId,
        content,
        sender: 'user' as const,
        messageType: 'text' as const,
        createdAt: new Date().toISOString(),
        metadata: {}
      };

      queryClient.setQueryData(['/api/chat', sessionId, 'messages'], (old: any) => {
        if (!old) return { messages: [optimisticUserMessage] };
        return { messages: [...old.messages, optimisticUserMessage] };
      });

      const response = await apiRequest('POST', `/api/chat/${sessionId}/messages`, {
        content,
        messageType: 'text'
      });
      const result = await response.json();

      // Add the new bot messages to the existing messages array instead of refetching
      if (result.messages && result.messages.length > 0) {
        queryClient.setQueryData(['/api/chat', sessionId, 'messages'], (old: any) => {
          if (!old) return { messages: result.messages };
          return { messages: [...old.messages, ...result.messages] };
        });
      }

      return result;
    },
  });

  // Select option mutation - NEVER invalidate queries to prevent flash
  const selectOptionMutation = useMutation({
    mutationFn: async ({ optionId, payload, optionText }: { optionId: string; payload?: any; optionText?: string }) => {
      // Don't create optimistic user message here - streaming will handle it
      logDebug('selectOption start', { optionId, optionText, sessionId });
      const response = await apiRequest('POST', `/api/chat/${sessionId}/select-option`, {
        optionId,
        payload,
        optionText
      });
      const result = await response.json();
      logDebug('selectOption response', result);

      return result;
    },
    // CRITICAL: Never invalidate queries on option select to prevent flash
    // Messages are updated via streaming callbacks instead
  });

  const sendMessage = useCallback(async (content: string) => {
    return sendMessageMutation.mutateAsync(content);
  }, [sendMessageMutation]);

  const selectOption = useCallback(async (optionId: string, payload?: any, optionText?: string) => {
    return selectOptionMutation.mutateAsync({ optionId, payload, optionText });
  }, [selectOptionMutation]);

  // Function to manually initialize session when chat is opened
  const initializeSession = useCallback(async () => {
    if (initializedSessionRef.current === sessionId) {
      logDebug('initializeSession skip (already initialized)', { sessionId });
      return session;
    }

    logDebug('initializeSession');
    // Enable and execute session creation immediately
    queryClient.setQueryDefaults(['/api/chat/session', sessionId, chatbotConfigId], { enabled: true });
    const sessionResult = await queryClient.fetchQuery({
      queryKey: ['/api/chat/session', sessionId, chatbotConfigId],
      queryFn: async () => {
        const response = await apiRequest('POST', '/api/chat/session', {
          sessionId,
          chatbotConfigId: chatbotConfigId || null
        });
        return response.json();
      },
    });

    initializedSessionRef.current = sessionId;

    // Session initialized - no need to invalidate queries for optimistic UI
    return sessionResult;
  }, [chatbotConfigId, queryClient, sessionId, session]);

  return {
    messages,
    sendMessage,
    sendStreamingMessage,
    selectOption,
    initializeSession,
    // Only use sendMessageMutation for isLoading - selectOption is handled by isStreaming
    // Including selectOptionMutation.isPending causes unnecessary re-renders/flash
    isLoading: sendMessageMutation.isPending,
    isTyping,
    isSessionLoading,
    isMessagesLoading,
    session: session?.session,
    readOnlyMode,
    limitExceededInfo,
  };
}
