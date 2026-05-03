import type { FastifyPluginAsync } from "fastify";
import helmet from "@fastify/helmet";

const plugin: FastifyPluginAsync = async (app) => {
  await app.register(helmet);
};

export default plugin;
