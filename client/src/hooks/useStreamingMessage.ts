import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Message } from '@shared/schema';

interface StreamingMessageConfig {
  sessionId: string;
  isStreaming: boolean;
  readOnlyMode: boolean;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
  onError?: (error: string) => void;
}

interface StreamingMessageHandlers {
  onBubbleReceived: (message: Message) => void;
  onAllComplete: (messages: Message[]) => void;
  onError: (error: string) => void;
}

/**
 * Custom hook to handle streaming message logic.
 * Encapsulates the pattern of:
 * 1. Sending a streaming message
 * 2. Adding bubbles to query cache as they arrive
 * 3. Tracking streaming state and bubble count
 */
export const useStreamingMessage = ({
  sessionId,
  isStreaming,
  readOnlyMode,
  onStreamStart,
  onStreamEnd,
  onError: onErrorCallback,
}: StreamingMessageConfig) => {
  const queryClient = useQueryClient();
  const streamingBubblesRef = useRef<Message[]>([]);

  const getStreamingHandlers = useCallback((): StreamingMessageHandlers => {
    return {
      onBubbleReceived: (message: Message) => {
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
        // Use flushSync to force immediate rendering and avoid React 18 batching
        import('react-dom').then(({ flushSync }) => {
          flushSync(() => {
            queryClient.setQueryData(
              ['/api/chat', sessionId, 'messages'],
              (old: any) => {
                if (!old) return { messages: [bubbleWithFlag] };
                return { messages: [...old.messages, bubbleWithFlag] };
              },
            );
          });
        });

        // Keep track of streaming bubbles for counting
        streamingBubblesRef.current.push(bubbleWithFlag);
      },

      onAllComplete: (messages: Message[]) => {
        // Clear the tracking ref since streaming is complete
        streamingBubblesRef.current = [];
        onStreamEnd?.();
      },

      onError: (error: string) => {
        streamingBubblesRef.current = [];
        onErrorCallback?.(error);
      },
    };
  }, [sessionId, queryClient, onStreamEnd, onErrorCallback]);

  return {
    streamingBubblesRef,
    getStreamingHandlers,
  };
};
