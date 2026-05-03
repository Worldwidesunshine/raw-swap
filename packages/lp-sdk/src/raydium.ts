import type { Connection } from "@solana/web3.js";
import type { PoolKey } from "./types.js";

/**
 * Raydium CPMM wrapper hook (Wave 04 / 07).
 * Replace with `Raydium.load` + `cpmm.getPoolInfo`.
 */
export async function fetchRaydiumCpmmSummary(
  _connection: Connection,
  pool: PoolKey,
): Promise<{ address: string; baseReserve: string } | null> {
  void _connection;
  return pool.venue === "raydium_cpmm"
    ? { address: pool.address, baseReserve: "0" }
    : null;
}

export function describeRaydiumDepositNote(poolAddress: string): string {
  return `Raydium cpmm.addLiquidity for pool ${poolAddress} — wire raydium-sdk-v2`;
}

export function describeRaydiumWithdrawNote(poolAddress: string): string {
  return `Raydium cpmm.removeLiquidity for pool ${poolAddress} — wire raydium-sdk-v2`;
}
