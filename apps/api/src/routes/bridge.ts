import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { Env } from "../env.js";
import { fetchDebridgeCreateTx } from "@rawswap/cross-chain";

/**
 * Whitelist of allowed deBridge DLN create-tx parameters.
 * Only these keys are forwarded to the upstream API.
 */
const bridgeParamsSchema = z.object({
  srcChainId: z.string().max(20).optional(),
  srcChainTokenIn: z.string().max(64).optional(),
  srcChainTokenInAmount: z.string().max(40).optional(),
  dstChainId: z.string().max(20).optional(),
  dstChainTokenOut: z.string().max(64).optional(),
  dstChainTokenOutAmount: z.string().max(40).optional(),
  dstChainTokenOutRecipient: z.string().max(64).optional(),
  senderAddress: z.string().max(64).optional(),
  srcChainOrderAuthorityAddress: z.string().max(64).optional(),
  dstChainOrderAuthorityAddress: z.string().max(64).optional(),
  affiliateFeePercent: z.string().max(10).optional(),
  affiliateFeeRecipient: z.string().max(64).optional(),
}).strict();

/** Dev-facing proxy for deBridge DLN `create-tx` (avoids browser CORS to dln.debridge.finance). */
const plugin: FastifyPluginAsync<{ env: Env }> = async (app, opts) => {
  app.get("/bridge/dln-create-tx", async (request, reply) => {
    try {
      const rawQuery = request.query as Record<string, unknown>;
      // Validate and strip to only allowed parameters
      const parsed = bridgeParamsSchema.safeParse(rawQuery);
      if (!parsed.success) {
        return reply.status(400).send({
          code: "INVALID_REQUEST",
          message: "Invalid bridge parameters.",
          details: parsed.error.flatten(),
        });
      }
      // Convert to Record<string, string> for the upstream fetch
      const params: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed.data)) {
        if (v !== undefined) params[k] = v;
      }
      const body = await fetchDebridgeCreateTx(params, {
        timeoutMs: opts.env.debridgeProxyTimeoutMs,
      });
      return body;
    } catch (err) {
      return reply.status(502).send({
        code: "BRIDGE_PROXY_FAILED",
        message: "deBridge create-tx request failed.",
      });
    }
  });
};

export default plugin;
