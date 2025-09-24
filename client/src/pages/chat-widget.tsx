import { useEffect, useState } from "react";
import ChatWidget from "@/components/chat/chat-widget";

export default function ChatWidgetPage() {
  const [sessionId, setSessionId] = useState<string>("");
  const [isEmbedded, setIsEmbedded] = useState<boolean>(false);

  useEffect(() => {
    // Check if we're in embedded mode
    const urlParams = new URLSearchParams(window.location.search);
    const embedded = urlParams.get('embedded') === 'true';
    setIsEmbedded(embedded);

    // Check if we have injected config from production widget
    const injectedConfig = (window as any).__CHAT_WIDGET_CONFIG__;
    
    if (injectedConfig && injectedConfig.sessionId) {
      setSessionId(injectedConfig.sessionId);
    } else {
      // Always generate a new session ID for each page load
      // This ensures that logged-in users get fresh conversations every time
      const paramSessionId = urlParams.get('sessionId');
      
      if (paramSessionId) {
        setSessionId(paramSessionId);
      } else {
        // Generate a new session ID - always fresh for each page load
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSessionId);
      }
    }

    // Set iframe-friendly styling when embedded
    if (embedded) {
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
      document.body.style.height = '100%';
    }
  }, []);

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If embedded, show only the chat widget
  if (isEmbedded) {
    // Check if we have a specific chatbot config from the injected config
    const injectedConfig = (window as any).__CHAT_WIDGET_CONFIG__;
    const chatbotConfig = injectedConfig?.chatbotConfig;
    
    // STRICT VALIDATION: No fallback allowed - must have valid chatbot config
    if (!injectedConfig?.embedded || !chatbotConfig?.id) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <div className="text-center p-4">
            <p className="text-gray-600 text-sm">Chat widget configuration error</p>
            <p className="text-gray-500 text-xs mt-1">No valid chatbot configuration found</p>
          </div>
        </div>
      );
    }
    
    // Check if chatbot is active
    if (!chatbotConfig.isActive) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <div className="text-center p-4">
            <p className="text-gray-600 text-sm">Chatbot is currently inactive</p>
            <p className="text-gray-500 text-xs mt-1">This chatbot has been disabled by the administrator</p>
          </div>
        </div>
      );
    }
    
    // Read theme colors from URL parameters first, then fallback to injected config, then defaults
    const urlParams = new URLSearchParams(window.location.search);
    
    const theme = {
      primaryColor: urlParams.get('primaryColor') || injectedConfig?.theme?.primaryColor || '#2563eb',
      backgroundColor: urlParams.get('backgroundColor') || injectedConfig?.theme?.backgroundColor || '#ffffff',
      textColor: urlParams.get('textColor') || injectedConfig?.theme?.textColor || '#1f2937'
    };
    
    return (
      <div 
        className="w-full h-full" 
        style={{ 
          height: '100vh', 
          margin: 0, 
          padding: 0,
          backgroundColor: theme.backgroundColor 
        }}
      >
        <ChatWidget 
          sessionId={sessionId} 
          primaryColor={theme.primaryColor}
          backgroundColor={theme.backgroundColor}
          textColor={theme.textColor}
          chatbotConfig={chatbotConfig}
        />
      </div>
    );
  }

  // Otherwise show the full demo page
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Demo website content */}
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-neutral-800 mb-4">Demo Website</h1>
          <p className="text-lg text-neutral-600 mb-8">
            This represents your existing website where the chat widget will be embedded.
          </p>
          
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-semibold text-neutral-800 mb-4">About Our Service</h2>
            <p className="text-neutral-600 leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">Features</h3>
              <ul className="space-y-2 text-neutral-600">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Feature One
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Feature Two
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Feature Three
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">Contact</h3>
              <p className="text-neutral-600">
                Have questions? Our chat widget on the bottom right can help you instantly!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      <ChatWidget sessionId={sessionId} />
    </div>
  );
}
