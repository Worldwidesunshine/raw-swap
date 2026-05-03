import type { FastifyPluginAsync } from "fastify";

/** Reserved for custom serializers; Fastify already configures pino via `logger: true`. */
const plugin: FastifyPluginAsync = async (app) => {
  app.log.trace("logger plugin loaded");
};

export default plugin;
