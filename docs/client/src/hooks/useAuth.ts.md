# Documentation for client/src/hooks/useAuth.ts

During SSR we can't call browser APIs or fetch auth state, so treat visitors as unauthenticated
Check if we're in embedded mode - if so, skip authentication entirely (SSR-safe)
Use Stack Auth user for authentication state
In embedded mode, return non-authenticated state without making any requests