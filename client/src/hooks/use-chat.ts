import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Message, ChatSession } from "@shared/schema";

export function useChat(sessionId: string) {
  const [isTyping, setIsTyping] = useState(false);
  const queryClient = useQueryClient();

  // Initialize session
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ['/api/chat/session'],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/chat/session', { sessionId });
      return response.json();
    },
    enabled: !!sessionId,
  });

  // Get messages
  const { data: messagesData, isLoading: isMessagesLoading } = useQuery({
    queryKey: ['/api/chat', sessionId, 'messages'],
    queryFn: async () => {
      const response = await fetch(`/api/chat/${sessionId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!sessionId && !!session,
  });

  const messages: Message[] = messagesData?.messages || [];

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
        id: Date.now().toString(),
        sessionId,
        content: userDisplayText,
        sender: 'user',
        messageType: 'text',
        metadata: {},
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(['/api/chat', sessionId, 'messages'], (old: any) => {
        if (!old) return { messages: [optimisticUserMessage] };
        return { messages: [...old.messages, optimisticUserMessage] };
      });

      const response = await fetch(`/api/chat/${sessionId}/messages/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: internalMessage || userDisplayText,
          messageType: 'text'
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'bubble' && data.message) {
                // A complete bubble has arrived - show it immediately
                onBubbleReceived?.(data.message);
              } else if (data.type === 'complete') {
                setIsTyping(false);
                onAllComplete?.(data.messages);
              } else if (data.type === 'error') {
                setIsTyping(false);
                onError?.(data.message);
              } else if (data.type === 'end') {
                setIsTyping(false);
                break;
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming data:', parseError);
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
      // Optimistically add user selection message
      const optimisticUserMessage = {
        id: Date.now(),
        sessionId,
        content: optionText || optionId,
        sender: 'user' as const,
        messageType: 'text' as const,
        createdAt: new Date().toISOString(),
        metadata: {}
      };

      queryClient.setQueryData(['/api/chat', sessionId, 'messages'], (old: any) => {
        if (!old) return { messages: [optimisticUserMessage] };
        return { messages: [...old.messages, optimisticUserMessage] };
      });

      const response = await apiRequest('POST', `/api/chat/${sessionId}/select-option`, {
        optionId,
        payload,
        optionText
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

  const sendMessage = async (content: string) => {
    return sendMessageMutation.mutateAsync(content);
  };

  const selectOption = async (optionId: string, payload?: any, optionText?: string) => {
    sendStreamingMessage(optionText || optionId, undefined, undefined, undefined, optionId)

  };

  return {
    messages,
    sendMessage,
    sendStreamingMessage,
    selectOption,
    isLoading: sendMessageMutation.isPending || selectOptionMutation.isPending,
    isTyping,
    isSessionLoading,
    isMessagesLoading,
    session: session?.session,
  };
}