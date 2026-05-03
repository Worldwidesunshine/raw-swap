import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { Env } from "../env.js";
import {
  createCrossChainTransfer,
  getCrossChainTransferById,
  getCrossChainTransfersByOrderId,
  listRecentCrossChainTransfers,
  patchCrossChainTransfer,
} from "../services/cross-chain-transfers.js";
import { readWalletFromSession } from "../utils/wallet-session.js";

const uuidParam = z.string().uuid();
const orderIdParam = z.string().min(1).max(256);

const plugin: FastifyPluginAsync<{ env: Env }> = async (app, opts) => {
  const requireWalletSession = (request: Parameters<typeof readWalletFromSession>[0]) =>
    readWalletFromSession(request, opts.env.executionAccessTokenSecret);

  app.post("/cross-chain/transfers", async (request, reply) => {
    const wallet = requireWalletSession(request);
    if (!wallet) {
      return reply.status(401).send({
        code: "UNAUTHORIZED",
        message: "Wallet session is required to record a transfer.",
      });
    }
    const body = typeof request.body === "object" && request.body !== null
      ? {
          ...(request.body as Record<string, unknown>),
          walletPublicKey: wallet,
          status: "created",
        }
      : request.body;
    return createCrossChainTransfer(body);
  });

  app.get("/cross-chain/transfers", async (request, reply) => {
    const wallet = requireWalletSession(request);
    if (!wallet) {
      return reply.status(401).send({
        code: "UNAUTHORIZED",
        message: "Wallet session is required to list transfers.",
      });
    }
    const q = request.query as Record<string, unknown>;
    const limit = z.coerce.number().int().min(1).max(100).catch(20).parse(q.limit);
    const requestedWallet =
      typeof q.wallet === "string" && q.wallet.length >= 32 ? q.wallet : wallet;
    if (requestedWallet !== wallet) {
      return reply.status(403).send({
        code: "FORBIDDEN",
        message: "You can only list transfers for your own wallet session.",
      });
    }
    const transfers = await listRecentCrossChainTransfers({ walletPublicKey: wallet, limit });
    return { transfers };
  });

  app.get<{ Params: { id: string } }>("/cross-chain/transfers/id/:id", async (request, reply) => {
    const wallet = requireWalletSession(request);
    if (!wallet) {
      return reply.status(401).send({
        code: "UNAUTHORIZED",
        message: "Wallet session is required to read a transfer.",
      });
    }
    const id = uuidParam.safeParse(request.params.id);
    if (!id.success) {
      return reply.status(400).send({ code: "INVALID_REQUEST", message: "Invalid id." });
    }
    const row = await getCrossChainTransferById(id.data);
    if (!row || row.walletPublicKey !== wallet) {
      return reply.status(404).send({ code: "NOT_FOUND", message: "Transfer not found." });
    }
    return row;
  });

  app.get<{ Params: { orderId: string } }>(
    "/cross-chain/transfers/order/:orderId",
    async (request, reply) => {
      const wallet = requireWalletSession(request);
      if (!wallet) {
        return reply.status(401).send({
          code: "UNAUTHORIZED",
          message: "Wallet session is required to read transfers.",
        });
      }
      const decoded = decodeURIComponent(request.params.orderId);
      const parsed = orderIdParam.safeParse(decoded);
      if (!parsed.success) {
        return reply.status(400).send({ code: "INVALID_REQUEST", message: "Invalid orderId." });
      }
      const transfers = await getCrossChainTransfersByOrderId(parsed.data, wallet);
      return { transfers };
    },
  );

  app.patch<{ Params: { id: string } }>(
    "/cross-chain/transfers/id/:id",
    async (request, reply) => {
      const id = uuidParam.safeParse(request.params.id);
      if (!id.success) {
        return reply.status(400).send({ code: "INVALID_REQUEST", message: "Invalid id." });
      }

      const wallet = requireWalletSession(request);
      if (!wallet) {
        return reply.status(401).send({
          code: "UNAUTHORIZED",
          message: "Wallet session is required to update a transfer.",
        });
      }

      const existing = await getCrossChainTransferById(id.data);
      if (!existing) {
        return reply.status(404).send({ code: "NOT_FOUND", message: "Transfer not found." });
      }
      if (existing.walletPublicKey !== wallet) {
        return reply.status(403).send({
          code: "FORBIDDEN",
          message: "You can only update transfers for your own wallet session.",
        });
      }

      const row = await patchCrossChainTransfer(id.data, request.body);
      if (!row) {
        return reply.status(404).send({ code: "NOT_FOUND", message: "Transfer not found." });
      }
      return row;
    },
  );
};

export default plugin;
