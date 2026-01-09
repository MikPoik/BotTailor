import { MessageCircleMore } from "lucide-react";

interface FloatingBubbleProps {
  color: string;
  onClick: () => void;
  hasNewMessage?: boolean;
}

export default function FloatingBubble({ color, onClick, hasNewMessage }: FloatingBubbleProps) {
  return (
    <div style={{ position: 'relative', width: '64px', height: '64px', zIndex: 50, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button
        type="button"
        onClick={onClick}
        className="rounded-full shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center"
        style={{ width: '56px', height: '56px', backgroundColor: color, border: `1px solid ${color}80`}}
      >
        <MessageCircleMore className="w-7 h-7 text-white" strokeWidth={1.5}/>
      </button>

      {hasNewMessage && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">1</span>
        </div>
      )}
    </div>
  );
}
