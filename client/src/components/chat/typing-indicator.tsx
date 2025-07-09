export default function TypingIndicator() {
  return (
    <div className="flex items-center space-x-3">
      <img 
        src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256" 
        alt="Bot avatar" 
        className="w-8 h-8 rounded-full"
      />
      <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm border">
        <div className="flex space-x-1">
          <div className="chat-typing-dots"></div>
          <div className="chat-typing-dots"></div>
          <div className="chat-typing-dots"></div>
        </div>
      </div>
    </div>
  );
}
