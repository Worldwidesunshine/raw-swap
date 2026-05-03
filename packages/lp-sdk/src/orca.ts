import type { Connection } from "@solana/web3.js";
import type { PoolKey } from "./types.js";

/**
 * Whirlpool SDK wrapper hook (Wave 04 / 07).
 * Replace with `@orca-so/whirlpools-sdk` + `WhirlpoolData` fetch.
 */
export async function fetchOrcaPoolSummary(
  _connection: Connection,
  pool: PoolKey,
): Promise<{ address: string; liquidityRaw: string } | null> {
  void _connection;
  return pool.venue === "orca_whirlpool"
    ? { address: pool.address, liquidityRaw: "0" }
    : null;
}

/** Build unsigned tx for splash / concentrated LP increase (TODO: SDK). */
export function describeOrcaDepositNote(poolAddress: string): string {
  return `Orca increaseLiquidity for pool ${poolAddress} — wire WhirlpoolIx.*`;
}

export function describeOrcaWithdrawNote(poolAddress: string): string {
  return `Orca decreaseLiquidity / close position for pool ${poolAddress} — wire WhirlpoolIx.*`;
}
