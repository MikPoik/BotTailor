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

  // Setter that persists to sessionStorage. Do NOT update React state to avoid
  // forcing a full-page re-render of consumers that only read the id.
  // If other parts of the app need to react to changes, they should listen
  // for the `global-chat-session-changed` event dispatched here.
  const sessionRef = { current: sessionId } as { current: string };
  const setGlobalSessionId = (id: string) => {
    try {
      safeSessionStorage.setItem(GLOBAL_SESSION_STORAGE_KEY, id);
    } catch (e) {
      // ignore storage errors
    }
    sessionRef.current = id;
    try {
      window.dispatchEvent(new CustomEvent('global-chat-session-changed', { detail: { id } }));
    } catch (e) {
      // ignore if window not available or event dispatch fails
    }
  };

  return { sessionId, setSessionId: setGlobalSessionId };
}