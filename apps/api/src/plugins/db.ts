import type { FastifyPluginAsync } from "fastify";
import { Pool } from "pg";
import type { Env } from "../env.js";
import { closeDb, setPool } from "../db/index.js";

const plugin: FastifyPluginAsync<{ env: Env }> = async (app, opts) => {
  const pool = new Pool({
    connectionString: opts.env.DATABASE_URL,
    max: Number(process.env.PG_POOL_MAX ?? "10"),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS ?? "30000"),
  });
  setPool(pool);
  app.addHook("onClose", async () => {
    await closeDb();
  });
};

export default plugin;
