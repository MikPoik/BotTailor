interface TypingIndicatorProps {
  chatbotConfig?: any;
}

export default function TypingIndicator({ chatbotConfig }: TypingIndicatorProps) {
  const avatarUrl = chatbotConfig?.avatarUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256";
  
  return (
    <div className="flex items-center space-x-3">
      <img 
        src={avatarUrl} 
        alt="Bot avatar" 
        className="w-8 h-8 rounded-full"
      />
      <div className="chat-message-bot">
        <div className="flex space-x-1">
          <div className="chat-typing-dots w-1 h-1"></div>
          <div className="chat-typing-dots w-1 h-1"></div>
          <div className="chat-typing-dots w-1 h-1"></div>
        </div>
      </div>
    </div>
  );
}
