 # Authentication & Authorization Overview

This project uses a header‑based Neon auth adapter. A lightweight middleware extracts `x-stack-user-id` and attaches `neonUser` to requests; protected endpoints enforce presence of that header.

## Key modules and files
- `server/neonAuth.ts` — middleware: `neonAuthMiddleware`, `isAuthenticated`, and `setupNeonAuth(app)` (applied in `server/index.ts`).
- `server/routes/auth.ts` — auth endpoints: `GET /api/auth/user`, `POST /api/ensure-user`, `GET /api/auth/admin-status` (lazy user creation and admin check).
- `server/storage.ts` — `upsertUser()` and `getUser()` used to persist/lookup application users.
- `client/src/lib/authUtils.ts` and `client/src/hooks/useAuth.ts` — client helpers/hooks that surface auth state (client attaches header via platform integration).
- `shared/schema.ts` — DB types including `neonAuthUsers` used to look up Neon profile data in production.

## Main types and contracts
- Identity source: HTTP header `x-stack-user-id` → middleware sets `(req as any).neonUser = { id: string }` when present.
- `isAuthenticated` middleware: returns `401` JSON when header missing; protected routes use it.
- Endpoints:
	- `GET /api/auth/user` — returns user record; if missing, queries Neon sync table (`neon_auth.users_sync`) or returns dev dummy data, then `storage.upsertUser()` to persist.
	- `POST /api/ensure-user` — similar to `/api/auth/user` but accepts profile data in body (used by client init in dev).
	- `GET /api/auth/admin-status` — returns `{ isAdmin: boolean }` by comparing `req.neonUser.id` to env `DEFAULT_SITE_ADMIN_USER_ID`.
- Dev mode behavior: when `NODE_ENV !== 'production'`, `fetchNeonAuthUser()` returns safe dummy data and endpoints accept query/body profile fields to seed the app user.

## Important flows and edge cases
- Middleware ordering: call `setupNeonAuth(app)` before registering routes (done in `server/index.ts`), otherwise `neonUser` won't be available.
- Missing header handling: protected endpoints must use `isAuthenticated`; callers without the header receive `401` early.
- Lazy user creation: app creates users on first access via `storage.upsertUser()` using Neon profile data; concurrent creation is mitigated by upsert semantics but still consider idempotency in callers.
- Neon sync lookup: in production the code queries `neon_auth.users_sync`; if that query fails or returns null the endpoints return `404` (handled gracefully).
- Admin check: compares raw user id strings — ensure `DEFAULT_SITE_ADMIN_USER_ID` matches the header provider format.

## How to extend or modify this domain
- Add protected routes: either rely on global `neonAuthMiddleware` (it attaches `neonUser`) and add `isAuthenticated` to endpoints that must block anonymous access.
- Move to other auth systems: replace `neonAuth.ts` internals and update routes to read the new `(req as any).neonUser` shape (or rename consistently). Update client helpers accordingly.
- Tests: unit test `neonAuthMiddleware`/`isAuthenticated`, and integration tests for `/api/auth/user` and `/api/ensure-user` in dev and production modes (mock `neon_auth.users_sync` results).

Assumptions
- The platform injects `x-stack-user-id` for authenticated requests; client code is responsible for integration with that platform. Production Neon profile lookup expects a synced `neon_auth.users_sync` table; dev mode falls back to dummy/profile values supplied by the client.
