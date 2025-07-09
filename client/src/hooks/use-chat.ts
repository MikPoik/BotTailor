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
    refetchInterval: 1000, // Poll for new messages
  });

  const messages: Message[] = messagesData?.messages || [];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', `/api/chat/${sessionId}/messages`, {
        content,
        messageType: 'text'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat', sessionId, 'messages'] });
    },
  });

  // Select option mutation
  const selectOptionMutation = useMutation({
    mutationFn: async ({ optionId, payload }: { optionId: string; payload?: any }) => {
      const response = await apiRequest('POST', `/api/chat/${sessionId}/select-option`, {
        optionId,
        payload
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat', sessionId, 'messages'] });
    },
  });

  const sendMessage = async (content: string) => {
    return sendMessageMutation.mutateAsync(content);
  };

  const selectOption = async (optionId: string, payload?: any) => {
    return selectOptionMutation.mutateAsync({ optionId, payload });
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
