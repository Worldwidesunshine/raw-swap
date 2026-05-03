import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { Queue } from "bullmq";
import type { Env } from "../env.js";

function redisConn(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 6379),
    username: u.username ? decodeURIComponent(u.username) : undefined,
    password: u.password ? decodeURIComponent(u.password) : undefined,
    maxRetriesPerRequest: null,
  };
}

declare module "fastify" {
  interface FastifyInstance {
    landingQueue: Queue;
  }
}

const plugin: FastifyPluginAsync<{ env: Env }> = async (app, opts) => {
  const landingQueue = new Queue("landing-monitor", {
    connection: redisConn(opts.env.REDIS_URL),
  });
  app.decorate("landingQueue", landingQueue);
  app.addHook("onClose", async () => {
    await landingQueue.close();
  });
};

export default fp(plugin, { name: "landing-queue" });
