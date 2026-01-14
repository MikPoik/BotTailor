/**
 * Drizzle ORM migration and type generation configuration.
 *
 * Responsibilities:
 * - Configures migration output, schema source, and DB dialect for Drizzle.
 * - Ensures DATABASE_URL is set before running migrations or typegen.
 * - Excludes neon_auth schema from migrations (read-only external schema).
 *
 * Constraints & Edge Cases:
 * - Must keep schema path in sync with shared/schema.ts (source of truth).
 * - Always run migrations before deploying code that relies on new schema.
 */
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  schemaFilter: ["public"], // Exclude neon_auth schema from migrations
});
