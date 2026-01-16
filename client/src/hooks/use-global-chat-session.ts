import { useState } from "react";

// Unified chat session management hook that works across all pages
export function useGlobalChatSession() {
  // Safe sessionStorage access that handles sandboxed environments
  const safeSessionStorage = {
    getItem: (key: string): string | null => {
      try {
        return sessionStorage.getItem(key);
      } catch (error) {
        console.warn('sessionStorage not accessible, using session-based fallback');
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        sessionStorage.setItem(key, value);
      } catch (error) {
        console.warn('sessionStorage not accessible, skipping storage');
      }
    }
  };

  // Single unified storage key for all pages
  const GLOBAL_SESSION_STORAGE_KEY = 'global-chat-session-id';

  // Generate or retrieve session ID from sessionStorage
  const [sessionId, setSessionId] = useState(() => {
    const storedSessionId = safeSessionStorage.getItem(GLOBAL_SESSION_STORAGE_KEY);

    if (storedSessionId) {
      return storedSessionId;
    }

    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    safeSessionStorage.setItem(GLOBAL_SESSION_STORAGE_KEY, newSessionId);
    return newSessionId;
  });

  // Setter that persists to sessionStorage as well as updating state
  const setGlobalSessionId = (id: string) => {
    try {
      safeSessionStorage.setItem(GLOBAL_SESSION_STORAGE_KEY, id);
    } catch (e) {
      // ignore storage errors
    }
    setSessionId(id);
  };

  return { sessionId, setSessionId: setGlobalSessionId };
}