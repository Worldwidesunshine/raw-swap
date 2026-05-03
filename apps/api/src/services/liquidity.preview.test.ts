import { describe, expect, it } from "vitest";
import { RawSwapError } from "@rawswap/shared";
import { previewLiquidityDeposit, previewLiquidityWithdraw } from "./liquidity.js";

/** Length-valid pool id for schema (not necessarily on-chain). */
const POOL = "So11111111111111111111111111111111111111112";

describe("previewLiquidityDeposit", () => {
  it("returns Orca sdk note and null unsigned tx", () => {
    const r = previewLiquidityDeposit({
      poolAddress: POOL,
      venue: "orca_whirlpool",
    });
    expect(r.unsignedTransactionBase64).toBeNull();
    expect(r.sdkNextStep).toContain(POOL);
    expect(r.venue).toBe("orca_whirlpool");
  });

  it("returns Raydium sdk note", () => {
    const r = previewLiquidityDeposit({
      poolAddress: POOL,
      venue: "raydium_cpmm",
    });
    expect(r.sdkNextStep).toContain(POOL);
    expect(r.venue).toBe("raydium_cpmm");
  });

  it("throws INVALID_REQUEST for invalid body", () => {
    expect(() =>
      previewLiquidityDeposit({ poolAddress: "short", venue: "orca_whirlpool" }),
    ).toThrow(RawSwapError);
    try {
      previewLiquidityDeposit({ poolAddress: "short", venue: "orca_whirlpool" });
    } catch (e) {
      expect(e).toBeInstanceOf(RawSwapError);
      expect((e as RawSwapError).shape.code).toBe("INVALID_REQUEST");
    }
  });
});

describe("previewLiquidityWithdraw", () => {
  it("matches deposit shape for withdraw note", () => {
    const r = previewLiquidityWithdraw({
      poolAddress: POOL,
      venue: "orca_whirlpool",
    });
    expect(r.unsignedTransactionBase64).toBeNull();
    expect(r.sdkNextStep).toContain(POOL);
  });
});
