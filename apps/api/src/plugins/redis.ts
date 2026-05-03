import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { Redis } from "ioredis";
import type { Env } from "../env.js";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
}

const plugin: FastifyPluginAsync<{ env: Env }> = async (app, opts) => {
  const redis = new Redis(opts.env.REDIS_URL);
  app.decorate("redis", redis);
  app.addHook("onClose", async () => {
    redis.disconnect();
  });
};

export default fp(plugin, { name: "redis" });
