/**
 * Drizzle ORM and Neon database connection setup.
 *
 * Responsibilities:
 * - Configures Neon serverless pool and Drizzle ORM with shared schema.
 * - Throws if DATABASE_URL is not set (required for all DB operations).
 * - Used by all storage and service modules for DB access.
 *
 * Constraints & Edge Cases:
 * - Must be initialized before any DB queries.
 * - Expects Postgres-compatible DATABASE_URL in environment.
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });