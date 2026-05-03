import type { FastifyPluginAsync } from "fastify";
import {
  RawSwapError,
  walletSessionRequestSchema,
  walletSessionResponseSchema,
} from "@rawswap/shared";
import type { Env } from "../env.js";
import {
  issueWalletSessionToken,
  verifyWalletSessionSignature,
} from "../utils/wallet-session.js";

const plugin: FastifyPluginAsync<{ env: Env }> = async (app, opts) => {
  app.post("/wallet-session", async (request, reply) => {
    const parsed = walletSessionRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new RawSwapError("INVALID_REQUEST", {
        message: "Wallet session request body is invalid.",
        details: { issues: parsed.error.flatten() },
      });
    }

    const body = parsed.data;
    if (
      !verifyWalletSessionSignature({
        walletPublicKey: body.walletPublicKey,
        issuedAt: body.issuedAt,
        signatureBase64: body.signatureBase64,
      })
    ) {
      return reply.status(401).send({
        code: "UNAUTHORIZED",
        message: "Wallet signature could not be verified.",
      });
    }

    const session = issueWalletSessionToken(
      body.walletPublicKey,
      opts.env.executionAccessTokenSecret,
    );

    return walletSessionResponseSchema.parse({
      walletPublicKey: body.walletPublicKey,
      walletSessionToken: session.token,
      expiresAt: session.expiresAt,
    });
  });
};

export default plugin;
