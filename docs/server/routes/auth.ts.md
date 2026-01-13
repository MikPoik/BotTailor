# Documentation for server/routes/auth.ts

Development mode check
Authentication routes for Neon Auth
Helper to fetch Neon Auth user profile
In development, use provided profile data or fallback to dummy data
If query fails in production, log error and return null
Get current user - lazy creation on first access
Try to get existing user from app database
If user doesn't exist, create them from Neon Auth data
Extract profile data from query params (for dev mode)
Query neon_auth.users_sync for profile data (or use dev dummy data)
Create user in app database
Ensure user exists endpoint (called on client initialization)
Try to get existing user
If user doesn't exist, create them
Extract profile data from request body (for dev mode)
Check if current user is admin