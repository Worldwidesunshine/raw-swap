import type { FastifyPluginAsync } from "fastify";
import type { Env } from "../env.js";
import { hasInternalAccess } from "../utils/internal-access.js";

const spec = {
  openapi: "3.0.3",
  info: {
    title: "Raw Swap API",
    version: "1.0.0",
    description:
      "Solana token swap execution API for token search, quote, build, submit, status, report, and liquidity flows. The bridge endpoints are development proxies that forward requests to upstream cross-chain services (avoiding browser CORS).",
  },
  servers: [{ url: "/" }],
  components: {
    securitySchemes: {
      ExecutionToken: {
        type: "apiKey",
        in: "header",
        name: "x-execution-token",
      },
    },
  },
  paths: {
    "/health": { get: { summary: "Liveness probe", responses: { "200": { description: "OK" } } } },
    "/ready": {
      get: {
        summary: "Readiness probe",
        responses: { "200": { description: "Ready" }, "503": { description: "Not ready" } },
      },
    },
    "/metrics": { get: { summary: "Prometheus metrics", responses: { "200": { description: "Metrics" } } } },
    "/api/quote": {
      post: {
        summary: "Fetch a route quote",
        responses: { "200": { description: "Quote created" }, "400": { description: "Validation error" } },
      },
    },
    "/api/tokens": {
      get: {
        summary: "Search supported tokens",
        parameters: [
          { in: "query", name: "query", required: false, schema: { type: "string" } },
          { in: "query", name: "limit", required: false, schema: { type: "integer" } },
        ],
        responses: { "200": { description: "Token search results" } },
      },
    },
    "/api/build": {
      post: {
        summary: "Build a signable transaction",
        responses: { "200": { description: "Transaction build created" }, "400": { description: "Build error" } },
      },
    },
    "/api/submit": {
      post: {
        summary: "Simulate and submit a signed transaction",
        responses: { "200": { description: "Execution submitted" }, "400": { description: "Submit error" } },
      },
    },
    "/api/bridge/dln-create-tx": {
      get: {
        summary: "Developer proxy — deBridge DLN create-tx",
        description:
          "Forwards all query parameters to `https://dln.debridge.finance/v1.0/dln/order/create-tx`. Use the same keys as deBridge DLN expects (e.g. chain ids, amounts, recipient). Returns upstream JSON or 502 when the proxy cannot reach or parse the response.",
        parameters: [],
        responses: {
          "200": { description: "deBridge create-tx JSON response" },
          "502": { description: "Proxy error (upstream non-JSON or HTTP error body)" },
        },
      },
    },
    "/api/liquidity/preview-deposit": {
      post: {
        summary: "Preview LP deposit (200 + SDK note; no unsigned tx yet)",
        responses: { "200": { description: "Preview payload" }, "400": { description: "Validation error" } },
      },
    },
    "/api/liquidity/preview-withdraw": {
      post: {
        summary: "Preview LP withdraw (200 + SDK note; no unsigned tx yet)",
        responses: { "200": { description: "Preview payload" }, "400": { description: "Validation error" } },
      },
    },
    "/api/liquidity/pools": {
      get: {
        summary: "List LP pools (PostgreSQL liquidity_pools merged with Orca/Raydium env addresses)",
        responses: { "200": { description: "Pool list" } },
      },
    },
    "/api/liquidity/deposit": {
      post: {
        summary: "Build LP deposit (stub or 501 until Orca/Raydium ix wiring)",
        description:
          "Returns 501 with documented `sdkNextStep`, null tx fields, and `documentation` hint. When `LP_DEV_STUB_LIQUIDITY_TX=1` and `userPublicKey` is set, returns 200 with a dev-only unsigned VersionedTransaction (placeholder transfer), same base64/hash shape as POST /api/build.",
        responses: {
          "200": { description: "Dev stub tx when LP_DEV_STUB_LIQUIDITY_TX is enabled" },
          "501": { description: "Real builder not implemented" },
          "400": { description: "Validation error" },
        },
      },
    },
    "/api/liquidity/withdraw": {
      post: {
        summary: "Build LP withdraw (stub or 501 until Orca/Raydium ix wiring)",
        description:
          "Same contract as /api/liquidity/deposit: 501 + documentation by default; optional dev stub via LP_DEV_STUB_LIQUIDITY_TX and userPublicKey.",
        responses: {
          "200": { description: "Dev stub tx when LP_DEV_STUB_LIQUIDITY_TX is enabled" },
          "501": { description: "Real builder not implemented" },
          "400": { description: "Validation error" },
        },
      },
    },
    "/api/liquidity/positions/{wallet}": {
      get: {
        summary: "List LP positions for wallet (lp_positions by wallet_public_key)",
        parameters: [
          { in: "path", name: "wallet", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Positions" },
          "400": { description: "Invalid wallet public key" },
        },
      },
    },
    "/api/cross-chain/transfers": {
      get: {
        summary: "List recent cross-chain transfer records",
        parameters: [
          { in: "query", name: "limit", required: false, schema: { type: "integer" } },
          { in: "query", name: "wallet", required: false, schema: { type: "string" } },
        ],
        responses: { "200": { description: "List of transfers" } },
      },
      post: {
        summary: "Create cross-chain transfer record (tracking row)",
        responses: { "200": { description: "Created record" }, "400": { description: "Validation error" } },
      },
    },
    "/api/cross-chain/transfers/id/{id}": {
      get: {
        summary: "Get cross-chain transfer by row id",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Transfer" },
          "400": { description: "Invalid id" },
          "404": { description: "Not found" },
        },
      },
      patch: {
        summary: "Update transfer status (and optional metadata)",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Updated transfer" },
          "400": { description: "Invalid body or id" },
          "404": { description: "Not found" },
        },
      },
    },
    "/api/cross-chain/transfers/order/{orderId}": {
      get: {
        summary: "List transfers with the same DLN order id",
        parameters: [{ in: "path", name: "orderId", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "List of transfers" } },
      },
    },
    "/api/status/{executionId}": {
      get: {
        summary: "Get execution status",
        security: [{ ExecutionToken: [] }],
        parameters: [
          { in: "path", name: "executionId", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: { "200": { description: "Status payload" }, "404": { description: "Not found" } },
      },
    },
    "/api/report/{executionId}": {
      get: {
        summary: "Get execution report",
        security: [{ ExecutionToken: [] }],
        parameters: [
          { in: "path", name: "executionId", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: { "200": { description: "Execution report" }, "404": { description: "Not found" } },
      },
    },
  },
} as const;

const docsHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Raw Swap API Docs</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 2rem; line-height: 1.5; }
      code, pre { background: #f6f8fa; padding: 0.15rem 0.35rem; border-radius: 4px; }
      pre { padding: 1rem; overflow: auto; }
    </style>
  </head>
  <body>
    <h1>Raw Swap API</h1>
    <p>OpenAPI spec: <a href="/openapi.json">/openapi.json</a></p>
    <p>Status and report endpoints require <code>x-execution-token</code> from the submit response.</p>
    <pre id="spec">Loading spec…</pre>
    <script>
      fetch('/openapi.json')
        .then((res) => res.json())
        .then((json) => {
          document.getElementById('spec').textContent = JSON.stringify(json, null, 2);
        });
    </script>
  </body>
</html>`;

const plugin: FastifyPluginAsync<{ env: Env }> = async (app, opts) => {
  if (!opts.env.enableApiDocs) {
    return;
  }

  app.get("/openapi.json", async (request, reply) => {
    if (!hasInternalAccess(request, opts.env.internalApiAccessToken)) {
      return reply.status(404).send({
        code: "NOT_FOUND",
        message: "Not found.",
      });
    }
    return spec;
  });
  app.get("/docs", async (request, reply) => {
    if (!hasInternalAccess(request, opts.env.internalApiAccessToken)) {
      return reply.status(404).send({
        code: "NOT_FOUND",
        message: "Not found.",
      });
    }
    reply.type("text/html").send(docsHtml);
  });
};

export default plugin;
