import { describe, expect, it } from "vitest";
import { normalizeVenue, poolRowFromDbShape } from "./normalize-venue.js";

describe("normalizeVenue", () => {
  it("maps Orca aliases to orca_whirlpool", () => {
    expect(normalizeVenue("orca_whirlpool")).toBe("orca_whirlpool");
    expect(normalizeVenue("ORCA")).toBe("orca_whirlpool");
    expect(normalizeVenue("  Whirlpool  ")).toBe("orca_whirlpool");
    expect(normalizeVenue("orca whirlpools")).toBe("orca_whirlpool");
  });

  it("maps Raydium aliases to raydium_cpmm", () => {
    expect(normalizeVenue("raydium_cpmm")).toBe("raydium_cpmm");
    expect(normalizeVenue("Raydium")).toBe("raydium_cpmm");
    expect(normalizeVenue("CPMM")).toBe("raydium_cpmm");
    expect(normalizeVenue("raydium cp")).toBe("raydium_cpmm");
  });

  it("returns null for unknown venues", () => {
    expect(normalizeVenue("")).toBeNull();
    expect(normalizeVenue("meteora")).toBeNull();
  });
});

describe("poolRowFromDbShape", () => {
  const mintA = "So11111111111111111111111111111111111111112";
  const mintB = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

  it("builds a LiquidityPoolEntry with normalized venue and label", () => {
    expect(
      poolRowFromDbShape({
        venue: "orca",
        poolAddress: "ABC1234567890abcdefghijklmnopqrstuvwxyz12",
        mintA,
        mintB,
        feeTierBps: 30,
      }),
    ).toEqual({
      venue: "orca_whirlpool",
      address: "ABC1234567890abcdefghijklmnopqrstuvwxyz12",
      label: "So11…1112 / EPjF…Dt1v (30 bps)",
    });
  });

  it("throws on unknown venue", () => {
    expect(() =>
      poolRowFromDbShape({
        venue: "unknown_dex",
        poolAddress: "ABC1234567890abcdefghijklmnopqrstuvwxyz12",
        mintA,
        mintB,
      }),
    ).toThrow(/Unknown liquidity venue/);
  });
});
