import type { FastifyPluginAsync } from "fastify";
import type { Env } from "../env.js";
import { submitSignedTransaction } from "../services/submit.js";

const plugin: FastifyPluginAsync<{ env: Env }> = async (app, opts) => {
  app.post("/submit", async (request) => {
    const redis = app.redis;
    const adapter = {
      get: (k: string) => redis.get(k),
      setex: async (k: string, s: number, v: string) => {
        await redis.setex(k, s, v);
      },
    };
    return submitSignedTransaction(request.body, opts.env, () => adapter, app.landingQueue);
  });
};

export default plugin;
