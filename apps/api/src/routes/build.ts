import type { FastifyPluginAsync } from "fastify";
import type { Env } from "../env.js";
import { createBuild } from "../services/build.js";
import { buildDuration } from "../plugins/metrics.js";

const plugin: FastifyPluginAsync<{ env: Env }> = async (app, opts) => {
  app.post("/build", async (request) => {
    const start = Date.now();
    try {
      const res = await createBuild(request.body, opts.env);
      buildDuration.observe({}, Date.now() - start);
      return res;
    } catch (e) {
      buildDuration.observe({}, Date.now() - start);
      throw e;
    }
  });
};

export default plugin;
