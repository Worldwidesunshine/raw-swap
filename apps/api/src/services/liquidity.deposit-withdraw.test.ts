import { describe, expect, it } from "vitest";
import { Keypair } from "@solana/web3.js";
import type { Env } from "../env.js";
import { RawSwapError } from "@rawswap/shared";
import {
  liquidityDepositNotImplementedBody,
  liquidityWithdrawNotImplementedBody,
  parseLiquidityDepositBody,
  parseLiquidityWithdrawBody,
  tryLiquidityDepositStub,
  tryLiquidityWithdrawStub,
} from "./liquidity.js";

const POOL = "So11111111111111111111111111111111111111112";

const mockLatestBlockhash = {
  blockhash: "11111111111111111111111111111111",
  lastValidBlockHeight: 1,
};

function baseEnv(overrides: Partial<Pick<Env, "lpDevStubLiquidityTx">> = {}): Env {
  return {
    NODE_ENV: "test",
    PORT: 3001,
    DATABASE_URL: "postgresql://localhost/test",
    REDIS_URL: "redis://localhost:6379",
    SOLANA_RPC_URL: "https://api.mainnet-beta.solana.com",
    JUPITER_API_KEY: "",
    JITO_BLOCK_ENGINE_URL: "https://mainnet.block-engine.jito.wtf",
    JITO_REGION: undefined,
    CORS_ORIGIN: "http://localhost:3000",
    EXECUTION_ACCESS_TOKEN_SECRET: "test-secret-at-least-16-chars",
    PROTOCOL_FEE_VAULT: undefined,
    TREASURY_WALLET: undefined,
    ORCA_RAWSWAP_SOL_POOL: undefined,
    RAYDIUM_RAWSWAP_SOL_POOL: undefined,
    LP_DEV_STUB_LIQUIDITY_TX: "",
    RAWSWAP_MINT: undefined,
    DEBRIDGE_AFFILIATE_RECIPIENT: undefined,
    DEBRIDGE_AFFILIATE_FEE_PERCENT: undefined,
    effectiveJitoBlockEngineUrl: "https://mainnet.block-engine.jito.wtf",
    executionAccessTokenSecret: "test-secret-at-least-16-chars",
    corsOrigins: ["http://localhost:3000"],
    lpDevStubLiquidityTx: overrides.lpDevStubLiquidityTx ?? false,
  };
}

describe("parseLiquidityDepositBody", () => {
  it("accepts optional userPublicKey", () => {
    const signer = Keypair.generate().publicKey.toBase58();
    const p = parseLiquidityDepositBody({
      poolAddress: POOL,
      venue: "orca_whirlpool",
      userPublicKey: signer,
    });
    expect(p.userPublicKey).toBe(signer);
  });

  it("rejects invalid pool id", () => {
    expect(() =>
      parseLiquidityDepositBody({ poolAddress: "short", venue: "orca_whirlpool" }),
    ).toThrow(RawSwapError);
  });
});

describe("liquidityDepositNotImplementedBody", () => {
  it("includes sdk note, null tx fields, and documentation", () => {
    const parsed = parseLiquidityDepositBody({ poolAddress: POOL, venue: "raydium_cpmm" });
    const b = liquidityDepositNotImplementedBody(parsed);
    expect(b.code).toBe("LIQUIDITY_DEPOSIT_TODO");
    expect(b.status).toBe("not_implemented");
    expect(b.unsignedTransactionBase64).toBeNull();
    expect(b.transactionMessageHashSha256Base64).toBeNull();
    expect(b.sdkNextStep).toContain(POOL);
    expect(b.documentation).toContain("LP_DEV_STUB_LIQUIDITY_TX");
  });
});

describe("liquidityWithdrawNotImplementedBody", () => {
  it("mirrors deposit contract for withdraw", () => {
    const parsed = parseLiquidityWithdrawBody({ poolAddress: POOL, venue: "orca_whirlpool" });
    const b = liquidityWithdrawNotImplementedBody(parsed);
    expect(b.code).toBe("LIQUIDITY_WITHDRAW_TODO");
    expect(b.unsignedTransactionBase64).toBeNull();
    expect(b.sdkNextStep).toContain("Orca");
  });
});

describe("tryLiquidityDepositStub", () => {
  it("returns null when stub env is off", async () => {
    const signer = Keypair.generate().publicKey.toBase58();
    const parsed = parseLiquidityDepositBody({
      poolAddress: POOL,
      venue: "orca_whirlpool",
      userPublicKey: signer,
    });
    const r = await tryLiquidityDepositStub(baseEnv({ lpDevStubLiquidityTx: false }), parsed, {
      getLatestBlockhash: async () => mockLatestBlockhash,
    });
    expect(r).toBeNull();
  });

  it("returns null when userPublicKey is missing", async () => {
    const parsed = parseLiquidityDepositBody({ poolAddress: POOL, venue: "orca_whirlpool" });
    const r = await tryLiquidityDepositStub(baseEnv({ lpDevStubLiquidityTx: true }), parsed, {
      getLatestBlockhash: async () => mockLatestBlockhash,
    });
    expect(r).toBeNull();
  });

  it("returns stub payload when env and signer are set", async () => {
    const signer = Keypair.generate().publicKey.toBase58();
    const parsed = parseLiquidityDepositBody({
      poolAddress: POOL,
      venue: "orca_whirlpool",
      userPublicKey: signer,
    });
    const r = await tryLiquidityDepositStub(baseEnv({ lpDevStubLiquidityTx: true }), parsed, {
      getLatestBlockhash: async () => mockLatestBlockhash,
    });
    expect(r).not.toBeNull();
    expect(r?.code).toBe("LIQUIDITY_DEPOSIT_STUB");
    expect(r?.unsignedTransactionBase64.length).toBeGreaterThan(0);
    expect(r?.transactionMessageHashSha256Base64.length).toBeGreaterThan(0);
    expect(r?.recentBlockhash).toBe(mockLatestBlockhash.blockhash);
  });
});

describe("tryLiquidityWithdrawStub", () => {
  it("returns stub when enabled", async () => {
    const signer = Keypair.generate().publicKey.toBase58();
    const parsed = parseLiquidityWithdrawBody({
      poolAddress: POOL,
      venue: "raydium_cpmm",
      userPublicKey: signer,
    });
    const r = await tryLiquidityWithdrawStub(baseEnv({ lpDevStubLiquidityTx: true }), parsed, {
      getLatestBlockhash: async () => mockLatestBlockhash,
    });
    expect(r?.code).toBe("LIQUIDITY_WITHDRAW_STUB");
  });
});
