import { QueryClient } from "@tanstack/react-query";

/**
 * Isolated QueryClient for the chat widget.
 * 
 * Separate from the app's global QueryClient to prevent:
 * - Host app refetches triggering widget updates
 * - Widget mutations invalidating host app data
 * - Cache thrashing when parent re-renders
 * 
 * Configuration prioritizes widget stability:
 * - Disabled refetchOnWindowFocus (widget shouldn't react to tab blur/focus)
 * - Longer stale time to reduce unnecessary refetches
 * - Conservative retry strategy
 * - Streaming-optimized garbage collection
 */
export const widgetQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (was cacheTime)
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Widget shouldn't refetch on window focus
      refetchOnReconnect: false, // Don't refetch on network reconnect
      refetchOnMount: false, // Don't refetch on mount
    },
    mutations: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
