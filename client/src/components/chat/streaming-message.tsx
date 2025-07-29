import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Message } from "@shared/schema";
import RichMessage from "./rich-message";

interface MessageChunk {
  content: string;
  messageType: string;
  metadata?: any;
  delay?: number;
}

interface StreamingMessageProps {
  message: Message;
  onOptionSelect: (optionId: string, payload?: any, optionText?: string) => void;
  onQuickReply: (reply: string) => void;
  chatbotConfig?: any;
  sessionId?: string;
}

export default function StreamingMessage({ 
  message, 
  onOptionSelect, 
  onQuickReply,
  chatbotConfig,
  sessionId
}: StreamingMessageProps) {
  const [visibleChunks, setVisibleChunks] = useState<MessageChunk[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);

  // Parse chunks from message metadata
  const chunks: MessageChunk[] = (message.metadata as any)?.chunks || [];
  const isStreaming = (message.metadata as any)?.isStreaming || false;
  const streamingComplete = (message.metadata as any)?.streamingComplete || false;

  useEffect(() => {
    if ((!isStreaming && !streamingComplete) || chunks.length === 0) {
      // Not a streaming message, show as normal
      setVisibleChunks([{
        content: message.content,
        messageType: message.messageType,
        metadata: message.metadata
      }]);
      return;
    }

    // If streaming is complete, show all chunks immediately
    if (streamingComplete) {
      setVisibleChunks(chunks);
      setCurrentChunkIndex(chunks.length);
      return;
    }

    // Reset state
    setVisibleChunks([]);
    setCurrentChunkIndex(0);

    // Start streaming chunks
    const showNextChunk = (index: number) => {
      if (index >= chunks.length) return;

      const chunk = chunks[index];
      const delay = chunk.delay || (index === 0 ? 0 : 800); // Default 800ms delay

      setTimeout(() => {
        setVisibleChunks(prev => [...prev, chunk]);
        setCurrentChunkIndex(index + 1);
        showNextChunk(index + 1);
      }, delay);
    };

    showNextChunk(0);
  }, [message.id, chunks.length, isStreaming]); // Use message.id instead of full message object

  if (!isStreaming && !streamingComplete) {
    // Render as normal message - avatar will be handled by MessageBubble
    return (
      <RichMessage
        message={message}
        onOptionSelect={onOptionSelect}
        onQuickReply={onQuickReply}
        chatbotConfig={chatbotConfig}
        sessionId={sessionId}
      />
    );
  }

  const [displayedChunks, setDisplayedChunks] = useState<any[]>([]);

  useEffect(() => {
    if ((message.metadata as any)?.chunks) {
      setDisplayedChunks((message.metadata as any).chunks);
    }
  }, [(message.metadata as any)?.chunks]);

  return (
    <div className="space-y-2">
        {visibleChunks.map((chunk, index) => (
          <div key={`chunk-${message.id}-${index}`} className="animate-fadeIn">
            <RichMessage
              message={{
                ...message,
                content: chunk.content,
                messageType: chunk.messageType as any,
                metadata: {
                  ...(message.metadata || {}),
                  ...(chunk.metadata || {})
                }
              }}
              onOptionSelect={onOptionSelect}
              onQuickReply={onQuickReply}
              chatbotConfig={chatbotConfig}
              sessionId={sessionId}
            />
          </div>
        ))}

        {/* Show typing indicator if more chunks are coming */}
        {currentChunkIndex < chunks.length && (
          <div className="flex space-x-1 p-3 max-w-sm">
            <div className="chat-typing-dots"></div>
            <div className="chat-typing-dots"></div>
            <div className="chat-typing-dots"></div>
          </div>
        )}

        {/* Show timestamp when streaming is complete */}
        {(currentChunkIndex >= chunks.length || streamingComplete) && (
          <span className="text-xs text-neutral-500 mt-1 block">
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </span>
        )}
    </div>
  );
}