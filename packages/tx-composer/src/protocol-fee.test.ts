import { describe, expect, it } from "vitest";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { protocolFeeSolTransfers, type ProtocolFeeSolParams } from "./protocol-fee.js";

function baseParams(overrides: Partial<ProtocolFeeSolParams> = {}): ProtocolFeeSolParams {
  return {
    payer: PublicKey.unique(),
    inputAmountLamports: 1_000_000_000n,
    feeVault: PublicKey.unique(),
    treasuryWallet: PublicKey.unique(),
    buybackBps: 10,
    treasuryBps: 5,
    ...overrides,
  };
}

describe("protocolFeeSolTransfers", () => {
  it("returns no instructions when both BPS are zero or negative", () => {
    expect(protocolFeeSolTransfers(baseParams({ buybackBps: 0, treasuryBps: 0 }))).toEqual([]);
    expect(protocolFeeSolTransfers(baseParams({ buybackBps: -1, treasuryBps: 0 }))).toEqual([]);
    expect(protocolFeeSolTransfers(baseParams({ buybackBps: 0, treasuryBps: -3 }))).toEqual([]);
  });

  it("emits only buyback transfer when treasury BPS is zero", () => {
    const p = baseParams({ buybackBps: 100, treasuryBps: 0 });
    const ixs = protocolFeeSolTransfers(p);
    expect(ixs).toHaveLength(1);
    expect(ixs[0].programId.equals(SystemProgram.programId)).toBe(true);
    expect(ixs[0].keys[0].pubkey.equals(p.payer)).toBe(true);
    expect(ixs[0].keys[1].pubkey.equals(p.feeVault)).toBe(true);
    expect(ixs[0].data.readBigUInt64LE(4)).toBe(10_000_000n); // 1e9 * 100 / 10000 (100 bps = 1%)
  });

  it("emits only treasury transfer when buyback BPS is zero", () => {
    const p = baseParams({ buybackBps: 0, treasuryBps: 50 });
    const ixs = protocolFeeSolTransfers(p);
    expect(ixs).toHaveLength(1);
    expect(ixs[0].keys[1].pubkey.equals(p.treasuryWallet)).toBe(true);
    expect(ixs[0].data.readBigUInt64LE(4)).toBe(5_000_000n);
  });

  it("floors sub-lamport fees to zero (no spurious transfers)", () => {
    expect(protocolFeeSolTransfers(baseParams({ inputAmountLamports: 99n, buybackBps: 1, treasuryBps: 0 }))).toEqual([]);
    expect(
      protocolFeeSolTransfers(baseParams({ inputAmountLamports: 9_999n, buybackBps: 1, treasuryBps: 1 })),
    ).toEqual([]);
  });

  it("uses integer division consistent with one-lamport remainder", () => {
    const p = baseParams({ inputAmountLamports: 19_999n, buybackBps: 1, treasuryBps: 1 });
    const ixs = protocolFeeSolTransfers(p);
    expect(ixs).toHaveLength(2);
    expect(ixs[0].data.readBigUInt64LE(4)).toBe(1n);
    expect(ixs[1].data.readBigUInt64LE(4)).toBe(1n);
  });

  it("throws when a fee slice exceeds JS safe integer lamports", () => {
    const tooBig = BigInt(Number.MAX_SAFE_INTEGER) + 1n;
    expect(() =>
      protocolFeeSolTransfers(
        baseParams({
          inputAmountLamports: tooBig,
          buybackBps: 10_000,
          treasuryBps: 0,
        }),
      ),
    ).toThrow(/safe integer/);
  });

  it("orders buyback then treasury when both are positive", () => {
    const p = baseParams({ buybackBps: 10, treasuryBps: 20 });
    const ixs = protocolFeeSolTransfers(p);
    expect(ixs).toHaveLength(2);
    expect(ixs[0].keys[1].pubkey.equals(p.feeVault)).toBe(true);
    expect(ixs[1].keys[1].pubkey.equals(p.treasuryWallet)).toBe(true);
  });
});
