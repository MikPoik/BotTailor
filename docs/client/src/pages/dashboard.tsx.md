# Documentation for client/src/pages/dashboard.tsx

Protect page with Stack Auth's built-in redirect
Update metadata on client side for CSR page
Fetch admin status from a server-side endpoint
Fetch conversation count for user's chatbots
Fetch current user subscription for usage display
Fetch survey analytics for all user chatbots
Aggregate analytics from all user chatbots
Aggregate totals
Get chatbot GUID from URL parameters or environment
Always fetch the site default chatbot for consistency across the site
This ensures the same default chatbot is used everywhere regardless of authentication status
Get selected chatbot configuration (always use site default for consistency)
Always use the site default chatbot configured via environment variables
This ensures consistent experience across the site for help/support