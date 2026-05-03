import { describe, expect, it } from "vitest";
import { BUYBACK_FEE_BPS, PROTOCOL_FEE_BPS, TREASURY_FEE_BPS } from "../constants/fee.js";
import { protocolFeeTotalLamports, splitProtocolFeeFromInput } from "./fee-math.js";

describe("fee-math", () => {
  it("protocolFeeTotalLamports uses PROTOCOL_FEE_BPS by default", () => {
    const input = 10_000_000n;
    expect(protocolFeeTotalLamports(input)).toBe((input * 16n) / 10000n);
  });

  it("splitProtocolFeeFromInput matches 12 / 4 of input (bps)", () => {
    const input = 100_000_000n;
    const { buyback, treasury } = splitProtocolFeeFromInput(input);
    expect(buyback).toBe((input * BigInt(BUYBACK_FEE_BPS)) / 10000n);
    expect(treasury).toBe((input * BigInt(TREASURY_FEE_BPS)) / 10000n);
    expect(buyback + treasury).toBe((input * BigInt(PROTOCOL_FEE_BPS)) / 10000n);
  });

  it("protocolFeeTotalLamports respects custom bps and floors", () => {
    expect(protocolFeeTotalLamports(10001n, 1)).toBe(1n);
    expect(protocolFeeTotalLamports(10000n, 100)).toBe(100n);
  });

  it("protocolFeeTotalLamports returns 0 for non-positive bps", () => {
    expect(protocolFeeTotalLamports(1_000_000n, 0)).toBe(0n);
    expect(protocolFeeTotalLamports(1_000_000n, -1)).toBe(0n);
  });

  it("splitProtocolFeeFromInput is zero for zero input", () => {
    expect(splitProtocolFeeFromInput(0n)).toEqual({ buyback: 0n, treasury: 0n });
  });
});

