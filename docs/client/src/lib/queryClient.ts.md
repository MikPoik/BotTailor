# Documentation for client/src/lib/queryClient.ts

Prefer chat widget config, fall back to new embed config
When embed.js passes the full widget URL (e.g. https://host/widget/uid/guid),
strip the path back to the origin so API calls don't hit /widget/.../api/.
Fallback to the raw string; add a warning so we can see misconfigurations
Only attempt to resolve Stack user on the client
User not authenticated; proceed without header
Use absolute URL when widget is embedded to avoid CORS issues
Use absolute URL when widget is embedded to avoid CORS issues