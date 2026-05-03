import type { FastifyPluginAsync } from "fastify";
import cors from "@fastify/cors";
import type { Env } from "../env.js";

const plugin: FastifyPluginAsync<{ env: Env }> = async (app, opts) => {
  const allowedOrigins = new Set(opts.env.corsOrigins);
  await app.register(cors, {
    credentials: true,
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.has(origin)) {
        cb(null, true);
        return;
      }
      cb(null, false);
    },
  });
};

export default plugin;
