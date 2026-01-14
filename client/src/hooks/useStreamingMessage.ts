/**
 * React hook for handling streaming chat message logic.
 *
 * Responsibilities:
 * - Encapsulates streaming message send, bubble tracking, and cache integration.
 * - Provides handlers for bubble receipt, completion, and error state.
 *
 * Constraints & Edge Cases:
 * - Streaming contract must match server (see use-chat.ts and server/openai/streaming-handler.ts).
 * - Bubble tracking is local to the hook; cache updates are handled by use-chat.ts.
 */
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
        // Just track bubbles - don't add to cache (use-chat.ts handles that)
        const isFollowUp = streamingBubblesRef.current.length > 0;
        const bubbleWithFlag = {
          ...message,
          metadata: {
            ...(message.metadata && typeof message.metadata === 'object' ? message.metadata : {}),
            isFollowUp,
            isStreaming: false,
          },
        };

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
