import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Message, ChatSession } from "@shared/schema";

export function useChat(sessionId: string, chatbotConfigId?: number) {
  const [isTyping, setIsTyping] = useState(false);
  const [readOnlyMode, setReadOnlyMode] = useState(false);
  const [limitExceededInfo, setLimitExceededInfo] = useState<{
    message: string;
    showContactForm: boolean;
    chatbotConfig?: any;
  } | null>(null);
  const queryClient = useQueryClient();

  // Safe localStorage access that handles sandboxed environments
  const safeLocalStorage = {
    getItem: (key: string): string | null => {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.warn('localStorage not accessible, using session-based fallback');
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.warn('localStorage not accessible, skipping storage');
      }
    },
    removeItem: (key: string): void => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('localStorage not accessible, skipping removal');
      }
    }
  };

  // Initialize session - only create when explicitly requested
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ['/api/chat/session', sessionId, chatbotConfigId],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/chat/session', { 
        sessionId,
        chatbotConfigId: chatbotConfigId || null
      });
      return response.json();
    },
    enabled: false, // Don't auto-create session on widget load
  });

  // Get messages
  const { data: messagesData, isLoading: isMessagesLoading } = useQuery({
    queryKey: ['/api/chat', sessionId, 'messages'],
    queryFn: async () => {
      // Use absolute URL when widget is embedded
      const config = (window as any).__CHAT_WIDGET_CONFIG__;
      const baseUrl = config?.apiUrl || '';
      const url = `/api/chat/${sessionId}/messages`;
      const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
      
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!sessionId && !!session,
    staleTime: 0, // Always refetch to ensure we get welcome message
  });

  const messages: Message[] = (messagesData?.messages || [])
    .filter((msg: Message) => msg.messageType !== 'system'); // Filter out system messages from UI

  // Check for existing limit exceeded state on page load
  useEffect(() => {
    const limitKey = `chat-limit-exceeded-${sessionId}`;
    const limitState = safeLocalStorage.getItem(limitKey);
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
        console.warn('Failed to parse limit state from localStorage:', error);
      }
    }
  }, [sessionId]);

  // Clear read-only state after a reasonable time (1 hour) to allow recovery
  useEffect(() => {
    if (readOnlyMode) {
      const recoveryTimer = setTimeout(() => {
        const limitKey = `chat-limit-exceeded-${sessionId}`;
        safeLocalStorage.removeItem(limitKey);
        setReadOnlyMode(false);
        setLimitExceededInfo(null);
        console.log('[CHAT] Cleared read-only state for potential recovery');
      }, 60 * 60 * 1000); // 1 hour

      return () => clearTimeout(recoveryTimer);
    }
  }, [readOnlyMode, sessionId]);

  // Streaming message function with real-time bubble parsing
  const sendStreamingMessage = async (
    userDisplayText: string,
    onBubbleReceived?: (message: Message) => void,
    onAllComplete?: (messages: Message[]) => void,
    onError?: (error: string) => void,
    internalMessage?: string
  ) => {
    try {
      setIsTyping(true);

      // Add optimistic user message to messages array
      const optimisticUserMessage: Message = {
        id: Date.now(), // Use number for consistency with schema
        sessionId,
        content: userDisplayText,
        sender: 'user',
        messageType: 'text',
        metadata: {},
        createdAt: new Date(), // Use Date object for schema consistency
      };

      // Ensure we fetch current messages before optimistic update to preserve welcome message
      const currentData = queryClient.getQueryData(['/api/chat', sessionId, 'messages']);
      if (!currentData) {
        // If no messages cached, fetch them first to ensure we don't lose welcome message
        const refreshPromise = queryClient.refetchQueries({ queryKey: ['/api/chat', sessionId, 'messages'] });
        await refreshPromise;
      }

      queryClient.setQueryData(['/api/chat', sessionId, 'messages'], (old: any) => {
        if (!old) return { messages: [optimisticUserMessage] };
        return { messages: [...old.messages, optimisticUserMessage] };
      });

      // Use absolute URL when widget is embedded
      const config = (window as any).__CHAT_WIDGET_CONFIG__;
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
        throw new Error('Stream request failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let buffer = ''; // Buffer for incomplete lines
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

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
                // A complete bubble has arrived - show it immediately
                onBubbleReceived?.(data.message);
              } else if (data.type === 'complete') {
                setIsTyping(false);
                onAllComplete?.(data.messages);
              } else if (data.type === 'limit_exceeded') {
                setIsTyping(false);
                setReadOnlyMode(true);
                setLimitExceededInfo({
                  message: data.message,
                  showContactForm: data.showContactForm,
                  chatbotConfig: data.chatbotConfig
                });
                // Store in localStorage to persist across page loads
                safeLocalStorage.setItem(`chat-limit-exceeded-${sessionId}`, JSON.stringify({
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
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming data:', parseError, 'Line:', line);
            }
          }
        }
      }
    } catch (error) {
      setIsTyping(false);
      console.error('Streaming error:', error);
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

  // Select option mutation
  const selectOptionMutation = useMutation({
    mutationFn: async ({ optionId, payload, optionText }: { optionId: string; payload?: any; optionText?: string }) => {
      // Don't create optimistic user message here - streaming will handle it
      const response = await apiRequest('POST', `/api/chat/${sessionId}/select-option`, {
        optionId,
        payload,
        optionText
      });
      const result = await response.json();

      return result;
    },
  });

  const sendMessage = async (content: string) => {
    return sendMessageMutation.mutateAsync(content);
  };

  const selectOption = async (optionId: string, payload?: any, optionText?: string) => {
    console.log(`[FRONTEND] Selecting option: ${optionId}, text: ${optionText}`);
    return selectOptionMutation.mutateAsync({ optionId, payload, optionText });
  };

  // Function to manually initialize session when chat is opened
  const initializeSession = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/chat/session', sessionId, chatbotConfigId] });
    // Also ensure messages are fetched to preserve welcome message
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat', sessionId, 'messages'] });
    }, 100);
  };

  return {
    messages,
    sendMessage,
    sendStreamingMessage,
    selectOption,
    initializeSession,
    isLoading: sendMessageMutation.isPending || selectOptionMutation.isPending,
    isTyping,
    isSessionLoading,
    isMessagesLoading,
    session: session?.session,
    readOnlyMode,
    limitExceededInfo,
  };
}