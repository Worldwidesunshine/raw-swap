import { BUYBACK_FEE_BPS, PROTOCOL_FEE_BPS, TREASURY_FEE_BPS } from "../constants/fee.js";

/**
 * Floor-divides `inputLamports * totalBps / 10000` (protocol fee in lamports).
 * Negative `totalBps` yields 0; fractional lamports are truncated toward zero.
 */
export function protocolFeeTotalLamports(inputLamports: bigint, totalBps: number = PROTOCOL_FEE_BPS): bigint {
  if (totalBps <= 0) return 0n;
  return (inputLamports * BigInt(totalBps)) / 10000n;
}

/** Split 12/4 bps of **input** (not of an already-summed fee) into buyback vs treasury lamports. */
export function splitProtocolFeeFromInput(inputLamports: bigint): { buyback: bigint; treasury: bigint } {
  const buyback = (inputLamports * BigInt(BUYBACK_FEE_BPS)) / 10000n;
  const treasury = (inputLamports * BigInt(TREASURY_FEE_BPS)) / 10000n;
  return { buyback, treasury };
}

