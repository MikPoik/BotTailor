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

  const { data: user, isLoading: queryLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 0, // Always check server for fresh auth state
    refetchOnWindowFocus: false,
    enabled: shouldFetch && !isEmbedded, // Disable the query until after mount or in embedded mode
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
    isAuthenticated: !!user,
    error,
  };
}
