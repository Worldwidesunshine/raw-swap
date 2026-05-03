import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";
import * as schema from "./schema/index.js";

let pool: Pool | null = null;
let dbInstance: NodePgDatabase<typeof schema> | null = null;

export function setPool(p: Pool) {
  pool = p;
  dbInstance = drizzle(pool, { schema });
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!dbInstance) throw new Error("Database not initialized");
  return dbInstance;
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
    dbInstance = null;
  }
}

export * from "./schema/index.js";
