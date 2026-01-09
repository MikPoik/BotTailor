import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InitialMessageBubblesProps {
  position: 'bottom-right' | 'bottom-left';
  visibleMessages: number[];
  initialMessages: string[];
  onDismissAll: () => void;
  onOpenChat: () => void;
}

export default function InitialMessageBubbles({
  position,
  visibleMessages,
  initialMessages,
  onDismissAll,
  onOpenChat
}: InitialMessageBubblesProps) {
  if (visibleMessages.length === 0) return null;

  return (
    <div
      className={cn(
        "absolute flex flex-col gap-2 transition-all duration-300",
        position === 'bottom-right' ? 'items-end' : 'items-start'
      )}
      style={{
        [position === 'bottom-right' ? 'right' : 'left']: '0',
        bottom: '80px',
        zIndex: 46,
        maxWidth: '380px',
        width: 'max-content',
        pointerEvents: 'auto'
      } as React.CSSProperties}
    >
      <button
        type="button"
        onClick={onDismissAll}
        className="bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-full p-2 shadow-lg border border-gray-200 transition-colors duration-200"
        title="Hide all messages"
      >
        <X className="w-4 h-4" />
      </button>

      <div
        className={cn(
          "flex flex-col gap-4",
          position === 'bottom-right' ? 'items-end' : 'items-start'
        )}
      >
        {visibleMessages
          .slice()
          .reverse()
          .map((messageIndex) => (
            <div
              key={`initial-message-${messageIndex}`}
              className={cn("relative", "animate-fadeIn")}
              style={{ maxWidth: '380px', minWidth: '280px' }}
            >
              <div 
                className="bg-white rounded-2xl shadow-xl border border-gray-300 px-3 py-2 relative cursor-pointer hover:shadow-2xl transition-shadow duration-200"
                onClick={onOpenChat}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-gray-800 text-sm leading-relaxed font-normal">
                      {initialMessages[messageIndex]}
                    </p>
                  </div>
                </div>

                <div 
                  className="absolute w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45"
                  style={{
                    [position === 'bottom-right' ? 'right' : 'left']: '24px',
                    bottom: '-8px',
                  } as React.CSSProperties}
                />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
