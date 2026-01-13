# Documentation for client/src/lib/widgetQueryClient.ts

Isolated QueryClient for the chat widget.

 Separate from the app's global QueryClient to prevent:
 - Host app refetches triggering widget updates
 - Widget mutations invalidating host app data
 - Cache thrashing when parent re-renders

 Configuration prioritizes widget stability:
 - Disabled refetchOnWindowFocus (widget shouldn't react to tab blur/focus)
 - Longer stale time to reduce unnecessary refetches
 - Conservative retry strategy
 - Streaming-optimized garbage collection
/