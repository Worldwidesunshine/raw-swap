import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

const requestIdPluginImpl: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", async (req, reply) => {
    reply.header("x-request-id", String(req.id));
  });
};

export const requestIdPlugin = fp(requestIdPluginImpl, { name: "request-id" });
export default requestIdPlugin;
