import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useAuth() {
  // Check if we're in embedded mode - if so, skip authentication entirely
  const urlEmbedded = new URLSearchParams(window.location.search).get('embedded') === 'true';
  const configEmbedded = (window as any).__CHAT_WIDGET_CONFIG__?.embedded;
  const isEmbedded = urlEmbedded || configEmbedded;

  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 0, // Always check server for fresh auth state
    refetchOnWindowFocus: false,
    enabled: !isEmbedded, // Disable the query completely in embedded mode
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
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}