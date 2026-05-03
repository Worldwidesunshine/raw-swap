/**
 * @rawswap/lp-sdk — Orca Whirlpools + Raydium CPMM helpers (Waves 01 / 04 / 07).
 */
export type { PoolKey, PoolVenue, LiquidityPlan } from "./types.js";
export type { LiquidityStubTx } from "./stub-liquidity-tx.js";
export { buildLiquidityDevStubVersionedTransaction } from "./stub-liquidity-tx.js";
export { fetchOrcaPoolSummary, describeOrcaDepositNote, describeOrcaWithdrawNote } from "./orca.js";
export {
  fetchRaydiumCpmmSummary,
  describeRaydiumDepositNote,
  describeRaydiumWithdrawNote,
} from "./raydium.js";
export { normalizeVenue, poolRowFromDbShape } from "./normalize-venue.js";

import type { LiquidityPoolEntry } from "@rawswap/shared";

/** Map configured env addresses into API-facing rows. */
export function poolsFromEnv_entries(args: {
  orca?: string | null;
  raydium?: string | null;
}): LiquidityPoolEntry[] {
  const out: LiquidityPoolEntry[] = [];
  if (args.orca) {
    out.push({ venue: "orca_whirlpool", address: args.orca, label: "RAWSWAP/SOL (Orca)" });
  }
  if (args.raydium) {
    out.push({ venue: "raydium_cpmm", address: args.raydium, label: "RAWSWAP/SOL (Raydium)" });
  }
  return out;
}
