import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";

interface ChatSessionContextValue {
  sessionId: string;
  setSessionId: (id: string) => void;
}

export const ChatSessionContext = createContext<ChatSessionContextValue | null>(null);

/**
 * ChatSessionProvider
 * 
 * Encapsulates session state for the widget in isolation from the host app.
 * Initializes a unique session ID on mount that persists for the widget lifetime.
 * 
 * Should wrap the entire ChatWidget to provide sessionId and lifecycle state.
 */
export function ChatSessionProvider({ children, initialSessionId }: { children: ReactNode; initialSessionId?: string }) {
  // Seed with provided session if available to keep a stable cross-page session
  const [sessionId, setSessionId] = useState<string>(initialSessionId || "");

  // Initialize session ID on mount or when initialSessionId changes
  useEffect(() => {
    // If caller provided a sessionId and it differs from current state, adopt it
    if (initialSessionId && initialSessionId !== sessionId) {
      setSessionId(initialSessionId);
      return;
    }

    if (!sessionId) {
      // Use UUID for guaranteed uniqueness
      const newSessionId = crypto.randomUUID();
      setSessionId(newSessionId);
    }
  }, [initialSessionId, sessionId]);

  const value = useMemo<ChatSessionContextValue>(
    () => ({
      sessionId,
      setSessionId,
    }),
    [sessionId]
  );

  return (
    <ChatSessionContext.Provider value={value}>
      {children}
    </ChatSessionContext.Provider>
  );
}

/**
 * useChatSession
 * 
 * Access session state within the widget.
 * Only available within a ChatSessionProvider.
 */
export function useChatSession(): ChatSessionContextValue {
  const context = useContext(ChatSessionContext);
  if (!context) {
    throw new Error(
      "useChatSession must be used within a ChatSessionProvider"
    );
  }
  return context;
}
