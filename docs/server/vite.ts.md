# Documentation for server/vite.ts

always reload the index.html file from disk incase it changes
Check if this route should be server-side rendered
Inject chat widget config if available
Inject embed config for /embed/:embedId in development
log(`SSR render (prod): ${pathname}`, "ssr");
Inject embed config for /embed/:embedId in production build too, if set