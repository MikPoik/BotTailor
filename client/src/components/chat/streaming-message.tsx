
import { useState, useEffect } from "react";
import { Message } from "@shared/schema";
import RichMessage from "./rich-message";

interface StreamingMessageProps {
  message: Message;
  onOptionSelect: (optionId: string, payload?: any, optionText?: string) => void;
  onQuickReply: (reply: string) => void;
}

interface MessageChunk {
  content: string;
  messageType: string;
  metadata?: any;
  delay?: number;
}

export default function StreamingMessage({ 
  message, 
  onOptionSelect, 
  onQuickReply 
}: StreamingMessageProps) {
  const [visibleChunks, setVisibleChunks] = useState<MessageChunk[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);

  // Parse chunks from message metadata
  const chunks: MessageChunk[] = message.metadata?.chunks || [];
  const isStreaming = message.metadata?.isStreaming || false;

  useEffect(() => {
    if (!isStreaming || chunks.length === 0) {
      // Not a streaming message, show as normal
      setVisibleChunks([{
        content: message.content,
        messageType: message.messageType,
        metadata: message.metadata
      }]);
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
  }, [message, chunks, isStreaming]);

  if (!isStreaming) {
    // Render as normal message
    return (
      <div className="flex items-start space-x-3">
        <img 
          src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256" 
          alt="Assistant" 
          className="w-8 h-8 rounded-full flex-shrink-0"
        />
        <div className="flex-1 space-y-2">
          <RichMessage
            message={message}
            onOptionSelect={onOptionSelect}
            onQuickReply={onQuickReply}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-3">
      <img 
        src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256" 
        alt="Assistant" 
        className="w-8 h-8 rounded-full flex-shrink-0"
      />
      <div className="flex-1 space-y-2">
        {visibleChunks.map((chunk, index) => (
          <div key={index} className="animate-fadeIn">
            <RichMessage
              message={{
                ...message,
                content: chunk.content,
                messageType: chunk.messageType as any,
                metadata: chunk.metadata
              }}
              onOptionSelect={onOptionSelect}
              onQuickReply={onQuickReply}
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
      </div>
    </div>
  );
}
