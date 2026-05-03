import Fastify from "fastify";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import AutoLoad from "@fastify/autoload";
import type { Env } from "./env.js";
import { requestIdPlugin } from "./middleware/request-id.js";
import { errorHandlerPlugin } from "./middleware/error-handler.js";
import { getDb } from "./db/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function buildApp(env: Env) {
  const app = Fastify({
    logger: true,
    requestIdLogLabel: "requestId",
    genReqId: () => crypto.randomUUID(),
    trustProxy: env.trustProxy,
  });

  await app.register(requestIdPlugin);
  await app.register(errorHandlerPlugin);

  await app.register(AutoLoad, {
    dir: path.join(__dirname, "plugins"),
    options: { env },
    forceESM: true,
  });

  app.get("/health", async () => ({ ok: true }));

  app.get("/ready", async (request, reply) => {
    let postgres = false;
    let redisOk = false;
    try {
      await getDb().execute(sql`SELECT 1`);
      postgres = true;
    } catch (err) {
      request.log.error({ err }, "postgres readiness failed");
    }
    try {
      await app.redis.ping();
      redisOk = true;
    } catch (err) {
      request.log.error({ err }, "redis readiness failed");
    }
    if (postgres && redisOk) {
      return { ok: true as const, postgres, redis: redisOk };
    }
    return reply
      .status(503)
      .send({ ok: false as const, postgres, redis: redisOk });
  });

  await app.register(AutoLoad, {
    dir: path.join(__dirname, "routes"),
    options: { prefix: "/api", env },
    forceESM: true,
  });

  return app;
}
