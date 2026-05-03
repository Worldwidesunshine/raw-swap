import type { FastifyPluginAsync } from "fastify";
import { searchSupportedTokens } from "../utils/token-catalog.js";
import type { Env } from "../env.js";

type TokenQuery = {
  query?: string;
  limit?: string;
};

const plugin: FastifyPluginAsync<{ env: Env }> = async (app, opts) => {
  app.get<{ Querystring: TokenQuery }>("/tokens", async (request) => {
    const query = typeof request.query.query === "string" ? request.query.query : "";
    const limitRaw = Number.parseInt(request.query.limit ?? "20", 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 20;
    return {
      tokens: await searchSupportedTokens(query, opts.env, limit),
    };
  });
};

export default plugin;
