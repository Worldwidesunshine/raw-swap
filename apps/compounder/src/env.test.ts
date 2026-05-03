import { describe, expect, it, vi, beforeEach } from "vitest";
import * as fs from "node:fs";
import { Keypair } from "@solana/web3.js";

// A known valid Solana pubkey for tests
const VAULT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

describe("compounder env", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    // Reset module cache so loadCompounderEnv re-parses
    vi.resetModules();
  });

  it("accepts valid env without RAWSWAP_MINT or COMPOUNDER_KEYPAIR_PATH", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("REDIS_URL", "redis://localhost:6379");
    vi.stubEnv("SOLANA_RPC_URL", "https://api.devnet.solana.com");
    vi.stubEnv("PROTOCOL_FEE_VAULT", VAULT);
    delete process.env.RAWSWAP_MINT;
    delete process.env.COMPOUNDER_KEYPAIR_PATH;
    const { loadCompounderEnv } = await import("./env.js");
    const env = loadCompounderEnv();
    expect(env.PROTOCOL_FEE_VAULT).toBe(VAULT);
    expect(env.RAWSWAP_MINT).toBeUndefined();
    expect(env.compounderKeypair).toBeNull();
    expect(env.feeVaultPubkey.toBase58()).toBe(VAULT);
  });

  it("treats blank RAWSWAP_MINT as unset", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("REDIS_URL", "redis://localhost:6379");
    vi.stubEnv("SOLANA_RPC_URL", "https://api.devnet.solana.com");
    vi.stubEnv("PROTOCOL_FEE_VAULT", VAULT);
    vi.stubEnv("RAWSWAP_MINT", "   ");
    const { loadCompounderEnv } = await import("./env.js");
    expect(loadCompounderEnv().RAWSWAP_MINT).toBeUndefined();
  });

  it("rejects invalid PROTOCOL_FEE_VAULT", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("REDIS_URL", "redis://localhost:6379");
    vi.stubEnv("SOLANA_RPC_URL", "https://api.devnet.solana.com");
    vi.stubEnv("PROTOCOL_FEE_VAULT", "not-a-pubkey");
    const { loadCompounderEnv } = await import("./env.js");
    expect(() => loadCompounderEnv()).toThrow(/PROTOCOL_FEE_VAULT/);
  });

  it("rejects invalid RAWSWAP_MINT when set", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("REDIS_URL", "redis://localhost:6379");
    vi.stubEnv("SOLANA_RPC_URL", "https://api.devnet.solana.com");
    vi.stubEnv("PROTOCOL_FEE_VAULT", VAULT);
    vi.stubEnv("RAWSWAP_MINT", "bad");
    const { loadCompounderEnv } = await import("./env.js");
    expect(() => loadCompounderEnv()).toThrow(/RAWSWAP_MINT/);
  });

  it("accepts optional valid RAWSWAP_MINT", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("REDIS_URL", "redis://localhost:6379");
    vi.stubEnv("SOLANA_RPC_URL", "https://api.devnet.solana.com");
    vi.stubEnv("PROTOCOL_FEE_VAULT", VAULT);
    vi.stubEnv("RAWSWAP_MINT", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
    const { loadCompounderEnv } = await import("./env.js");
    expect(loadCompounderEnv().RAWSWAP_MINT).toBe(
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    );
  });

  it("defaults BUYBACK_THRESHOLD_LAMPORTS to 1 SOL", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("REDIS_URL", "redis://localhost:6379");
    vi.stubEnv("SOLANA_RPC_URL", "https://api.devnet.solana.com");
    vi.stubEnv("PROTOCOL_FEE_VAULT", VAULT);
    const { loadCompounderEnv } = await import("./env.js");
    expect(loadCompounderEnv().BUYBACK_THRESHOLD_LAMPORTS).toBe(1_000_000_000);
  });

  it("accepts custom BUYBACK_THRESHOLD_LAMPORTS", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("REDIS_URL", "redis://localhost:6379");
    vi.stubEnv("SOLANA_RPC_URL", "https://api.devnet.solana.com");
    vi.stubEnv("PROTOCOL_FEE_VAULT", VAULT);
    vi.stubEnv("BUYBACK_THRESHOLD_LAMPORTS", "500000000");
    const { loadCompounderEnv } = await import("./env.js");
    expect(loadCompounderEnv().BUYBACK_THRESHOLD_LAMPORTS).toBe(500_000_000);
  });
});
