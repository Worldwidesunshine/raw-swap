import type { FastifyPluginAsync } from "fastify";
import type { Env } from "../env.js";
import { registry } from "./metrics.js";
import { hasInternalAccess } from "../utils/internal-access.js";

const plugin: FastifyPluginAsync<{ env: Env }> = async (app, opts) => {
  app.get("/metrics", async (request, reply) => {
    if (!hasInternalAccess(request, opts.env.internalApiAccessToken)) {
      return reply.status(404).send({
        code: "NOT_FOUND",
        message: "Not found.",
      });
    }
    reply.header("content-type", registry.contentType);
    return reply.send(await registry.metrics());
  });
};

export default plugin;
