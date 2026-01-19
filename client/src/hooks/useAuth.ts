/**
 * React hook for client-side authentication state.
 *
 * Responsibilities:
 * - Surfaces user, isAuthenticated, isLoading, and error state for the app.
 * - Integrates with Stack Auth and attaches x-stack-user-id header for API requests.
 * - Handles SSR and embedded widget modes (skips auth in embedded mode).
 *
 * Constraints & Edge Cases:
 * - SSR returns unauthenticated state (no browser APIs).
 * - Embedded mode disables auth entirely.
 * - Must match server-side header and user contract.
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useAuth() {
  // During SSR we can't call browser APIs or fetch auth state, so treat visitors as unauthenticated
  if (typeof window === 'undefined') {
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    };
  }

  const [shouldFetch, setShouldFetch] = useState(false);

  useEffect(() => {
    setShouldFetch(true);
  }, []);

  // Check if we're in embedded mode - if so, skip authentication entirely (SSR-safe)
  const urlEmbedded = typeof window !== 'undefined' ? 
    new URLSearchParams(window.location.search).get('embedded') === 'true' : false;
  const configEmbedded = typeof window !== 'undefined' ? 
    (window as any).__CHAT_WIDGET_CONFIG__?.embedded : false;
  const isEmbedded = urlEmbedded || configEmbedded;

  // Use Stack Auth user for authentication state
  // The Stack hooks throw if used before the `StackProvider` is mounted. To avoid
  // a runtime error during the brief client startup window (e.g. auth redirects),
  // poll for a global readiness flag and catch hook errors until the provider
  // becomes available.
  const [stackInitialized, setStackInitialized] = useState<boolean>(() => typeof window !== 'undefined' && !!(window as any).__STACK_INITIALIZED__);

  useEffect(() => {
    if (typeof window === 'undefined' || stackInitialized) return;
    // Listen for explicit event fired by App when Stack is initialized
    const onInit = () => setStackInitialized(true);
    window.addEventListener('stack-initialized', onInit);

    // Fallback polling in case the event was missed (short-lived)
    const id = window.setInterval(() => {
      if ((window as any).__STACK_INITIALIZED__) {
        setStackInitialized(true);
      }
    }, 50);

    // Try immediate check
    if ((window as any).__STACK_INITIALIZED__) setStackInitialized(true);

    return () => {
      window.removeEventListener('stack-initialized', onInit);
      clearInterval(id);
    };
  }, [stackInitialized]);

  // Instead of calling `useStackUser()` (which throws if provider isn't mounted),
  // wait for `stackInitialized` and then use the `/api/auth/user` query to
  // determine auth state. This avoids calling provider-only hooks during
  // the fragile startup window and keeps hook order stable.
  const shouldEnableQuery = shouldFetch && !isEmbedded && stackInitialized;

  const { data: user, isLoading: queryLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 0, // Always check server for fresh auth state
    refetchOnWindowFocus: false,
    enabled: shouldEnableQuery,
  });

  // In embedded mode, return non-authenticated state without making any requests
  if (isEmbedded) {
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    };
  }

  return {
    user: user ?? null,
    isLoading: shouldFetch ? queryLoading : false,
    // Consider the user authenticated when the server-side `/api/auth/user`
    // returned a non-null user object. Avoid depending on provider-only
    // hooks during startup to keep hook order stable.
    isAuthenticated: !!user,
    error,
  };
}
