 # Database Overview

This domain defines the application's Postgres schema (Drizzle ORM), DB access layer, migrations, and type contracts. Canonical schema and types live in `shared/schema.ts`. The runtime DB client is created in `server/db.ts` (Neon serverless pool + `drizzle`).

## Key modules and files
- `shared/schema.ts` — canonical Drizzle table definitions, Zod/Drizzle helper schemas, and exported TypeScript types (users, chatbots, sessions, messages, website content, surveys, subscriptions, embed designs, etc.).
- `server/db.ts` — exports `pool` and `db` (Neon serverless `Pool` + `drizzle`) and is the single DB client used across the server.
- `migrations/` and `drizzle.config.ts` — migration scripts and Drizzle configuration for generating types and applying schema changes.
- `server/storage.ts` — high‑level DB access/DAO implementation that uses `db` and shared types; many services depend on its helpers.
- `server/seed-plans.ts` — idempotent seed logic for subscription plans and other bootstrap data.

## Main types and contracts
- Source of truth: `shared/schema.ts` — update this file for any table/type changes; it also contains Zod schemas and insert/update helpers used by the app.
- Type exports: `UpsertUser`, `ChatbotConfig`, `Message`, `Survey`, `Subscription`, etc., are exported from `shared/schema.ts` and consumed by `server/` code.
- Embeddings: `website_content.embedding` is a `vector` column with dimensions 1536 (OpenAI ada embedding size). Assumption: Postgres has `pgvector` (or compatible) extension available in the target DB.
- Neon integration: a separate `neon_auth.users_sync` schema/table is referenced (read‑only for Neon profile lookups) — it is not managed by the app migrations.

## Important flows and edge cases
- Connection & pool: `server/db.ts` throws if `DATABASE_URL` is missing; it sets up a `Pool` and `drizzle` client. Ensure `DATABASE_URL` is present in environments (CI, prod, local env files).
- Migrations and deploys: always run migrations (CI or deployment hook) before deploying code that relies on new columns/tables. `drizzle.config.ts` controls migration paths and type generation.
- Transactions and concurrency: use transactions for multi‑step operations (e.g., creating sessions + messages, survey lifecycle updates). Many storage helpers use `upsert` patterns — be defensive about unique constraints and idempotency.
- Vector columns and extensions: embedding vector types require DB extensions and may affect dump/restore workflows; test migrations restore on target infra (Neon, Postgres). Vector dimension mismatch will cause runtime failures when inserting embeddings.
- Cascade and foreign keys: some tables use `onDelete: cascade` (e.g., survey sessions → surveys). Be mindful when deleting parent records; backups and soft deletes can prevent data loss.

## How to extend or modify this domain
- Add a table or column:
	1. Add Drizzle table definition and Zod/insert schema to `shared/schema.ts`.
	2. Add a SQL migration under `migrations/` (follow project naming conventions) and update `drizzle.config.ts` if needed.
	3. Rebuild types (Drizzle/TypeGen) and update `server/storage.ts` usage and any callers.
	4. Add unit and integration tests for new storage helpers; test migrations in a disposable DB instance.
- Embeddings: if changing embedding dimensions or provider, update `website_content.embedding` type, migration scripts, and any code that writes/reads embeddings (search, RAG builders).
- Schema refactors: coordinate changes across `shared/schema.ts`, `server/storage.ts`, `server/openai/context-builder.ts`, and any UI consumers that rely on row shapes.

## Operational notes and assumptions
- Required env: `DATABASE_URL` must be set; missing it causes startup failure in `server/db.ts`.
- DB flavor: Postgres (Neon serverless configured): confirm `pgvector` and other extensions are provisioned when using vector columns.
- Data migrations: seed scripts like `server/seed-plans.ts` are intended to be idempotent — run them in CI or on deploy as needed.
- Backups & restores: test migration + restore workflows especially when vector columns or extensions are involved.

Keep `shared/schema.ts` small‑scope and authoritative — code should import types from it rather than re‑defining row shapes elsewhere.
