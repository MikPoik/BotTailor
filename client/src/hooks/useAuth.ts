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
import { useUser as useStackUser } from '@stackframe/react';

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
  const stackUser = useStackUser();

  const { data: user, isLoading: queryLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 0, // Always check server for fresh auth state
    refetchOnWindowFocus: false,
    enabled: shouldFetch && !isEmbedded && !!stackUser, // Only fetch if Stack user exists
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
    isAuthenticated: !!stackUser && !!user,
    error,
  };
}
