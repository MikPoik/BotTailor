# Documentation for server/neonAuth.ts

Neon Auth middleware for extracting user information from Stack Auth headers
 Stack Auth automatically includes x-stack-user-id header when user is authenticated
/
Attach user info to request for downstream handlers

 Middleware to require authentication
 Returns 401 if user is not authenticated
/

 Setup Neon Auth middleware on the Express app
/
Apply Neon Auth middleware globally