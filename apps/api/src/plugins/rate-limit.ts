import type { FastifyPluginAsync } from "fastify";
import rateLimit from "@fastify/rate-limit";
import fp from "fastify-plugin";

const plugin: FastifyPluginAsync = async (app) => {
  // Global default: generous for reads
  await app.register(rateLimit, {
    max: 200,
    timeWindow: "1 minute",
    redis: app.redis,
  });

  // Tighter limits for state-mutating endpoints
  app.addHook("onRoute", (routeOptions) => {
    const method = Array.isArray(routeOptions.method) ? routeOptions.method : [routeOptions.method];
    const url = routeOptions.url;

    // Submit endpoint: very tight (protects on-chain actions)
    if (url === "/api/submit" && method.includes("POST")) {
      routeOptions.config = {
        ...((routeOptions.config as Record<string, unknown>) ?? {}),
        rateLimit: { max: 15, timeWindow: "1 minute" },
      };
    }

    // Cross-chain mutations: moderate
    if (url.startsWith("/api/cross-chain/transfers") && (method.includes("POST") || method.includes("PATCH"))) {
      routeOptions.config = {
        ...((routeOptions.config as Record<string, unknown>) ?? {}),
        rateLimit: { max: 20, timeWindow: "1 minute" },
      };
    }

    // Bridge proxy
    if (url === "/api/bridge/dln-create-tx") {
      routeOptions.config = {
        ...((routeOptions.config as Record<string, unknown>) ?? {}),
        rateLimit: { max: 30, timeWindow: "1 minute" },
      };
    }

    // Liquidity mutations
    if (url.startsWith("/api/liquidity/") && method.includes("POST")) {
      routeOptions.config = {
        ...((routeOptions.config as Record<string, unknown>) ?? {}),
        rateLimit: { max: 20, timeWindow: "1 minute" },
      };
    }
  });
};

export default fp(plugin, { name: "rate-limit", dependencies: ["redis"] });
