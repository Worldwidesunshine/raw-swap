import { describe, expect, it } from "vitest";
import { SOL_MINT } from "@rawswap/shared";
import type { Env } from "../env.js";
import {
  defaultBaseAmount,
  formatUiAmount,
  resolveSwapTokens,
  searchSupportedTokens,
} from "./token-catalog.js";

const TEST_ENV: Env = {
  NODE_ENV: "test",
  PORT: 3001,
  DATABASE_URL: "postgresql://localhost:5432/rawswap",
  REDIS_URL: "redis://localhost:6379",
  SOLANA_RPC_URL: "https://api.mainnet-beta.solana.com",
  JUPITER_API_KEY: "",
  JITO_BLOCK_ENGINE_URL: "https://mainnet.block-engine.jito.wtf",
  JITO_REGION: undefined,
  CORS_ORIGIN: "http://localhost:3000",
  EXECUTION_ACCESS_TOKEN_SECRET: undefined,
  effectiveJitoBlockEngineUrl: "https://mainnet.block-engine.jito.wtf",
  executionAccessTokenSecret: "rawswap-test-execution-access-token-secret",
  corsOrigins: ["http://localhost:3000"],
};

describe("token catalog helpers", () => {
  it("formats base amounts without precision loss for high-decimal tokens", () => {
    expect(formatUiAmount("1000000000000000000", 18)).toBe("1.0");
    expect(defaultBaseAmount(18)).toBe("1000000000000000000");
  });

  it("rejects swaps where input and output mints are the same", async () => {
    await expect(resolveSwapTokens(SOL_MINT, SOL_MINT, TEST_ENV)).rejects.toMatchObject({
      shape: {
        code: "INVALID_REQUEST",
      },
    });
  });

  it("returns featured tokens for an empty search without upstream calls", async () => {
    const tokens = await searchSupportedTokens("", TEST_ENV, 20);
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.some((token) => token.mint === SOL_MINT)).toBe(true);
  });
});
