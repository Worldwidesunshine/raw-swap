import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { Env } from "../env.js";
import {
  listConfiguredPools,
  listLpPositionsForWallet,
  liquidityDepositNotImplementedBody,
  liquidityWithdrawNotImplementedBody,
  parseLiquidityDepositBody,
  parseLiquidityWithdrawBody,
  previewLiquidityDeposit,
  previewLiquidityWithdraw,
  tryLiquidityDepositStub,
  tryLiquidityWithdrawStub,
} from "../services/liquidity.js";

const walletPublicKeySchema = z.string().min(32).max(44);

/**
 * User LP provision API (Waves 07–09).
 */
const plugin: FastifyPluginAsync<{ env: Env }> = async (app, opts) => {
  app.get("/liquidity/pools", async () => listConfiguredPools(opts.env));

  app.post("/liquidity/preview-deposit", async (request) => previewLiquidityDeposit(request.body));

  app.post("/liquidity/preview-withdraw", async (request) => previewLiquidityWithdraw(request.body));

  app.post("/liquidity/deposit", async (request, reply) => {
    const parsed = parseLiquidityDepositBody(request.body);
    const stub = await tryLiquidityDepositStub(opts.env, parsed);
    if (stub) return reply.status(200).send(stub);
    return reply.status(501).send(liquidityDepositNotImplementedBody(parsed));
  });

  app.post("/liquidity/withdraw", async (request, reply) => {
    const parsed = parseLiquidityWithdrawBody(request.body);
    const stub = await tryLiquidityWithdrawStub(opts.env, parsed);
    if (stub) return reply.status(200).send(stub);
    return reply.status(501).send(liquidityWithdrawNotImplementedBody(parsed));
  });

  app.get<{ Params: { wallet: string } }>("/liquidity/positions/:wallet", async (request, reply) => {
    const parsedWallet = walletPublicKeySchema.safeParse(request.params.wallet);
    if (!parsedWallet.success) {
      return reply.status(400).send({
        code: "INVALID_REQUEST",
        message: "Invalid wallet public key.",
      });
    }
    return listLpPositionsForWallet(parsedWallet.data);
  });
};

export default plugin;
