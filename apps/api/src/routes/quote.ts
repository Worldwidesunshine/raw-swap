import type { FastifyPluginAsync } from "fastify";
import type { Env } from "../env.js";
import { createQuote } from "../services/quote.js";
import { quoteDuration } from "../plugins/metrics.js";

const plugin: FastifyPluginAsync<{ env: Env }> = async (app, opts) => {
  app.post("/quote", async (request) => {
    const start = Date.now();
    try {
      const res = await createQuote(request.body, opts.env);
      quoteDuration.observe({}, Date.now() - start);
      return res;
    } catch (e) {
      quoteDuration.observe({}, Date.now() - start);
      throw e;
    }
  });
};

export default plugin;
