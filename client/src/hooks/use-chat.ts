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

  // Send message mutation
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
      
      // After successful response, refetch all messages to get the full multi-bubble conversation
      await queryClient.invalidateQueries({ queryKey: ['/api/chat', sessionId, 'messages'] });
      
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
      
      // After successful response, refetch all messages to get the full multi-bubble conversation
      await queryClient.invalidateQueries({ queryKey: ['/api/chat', sessionId, 'messages'] });
      
      return result;
    },
  });

  const sendMessage = async (content: string) => {
    return sendMessageMutation.mutateAsync(content);
  };

  const selectOption = async (optionId: string, payload?: any, optionText?: string) => {
    return selectOptionMutation.mutateAsync({ optionId, payload, optionText });
  };

  return {
    messages,
    sendMessage,
    selectOption,
    isLoading: sendMessageMutation.isPending || selectOptionMutation.isPending,
    isSessionLoading,
    isMessagesLoading,
    session: session?.session,
  };
}
