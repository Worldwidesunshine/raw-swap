import type { LiquidityPoolEntry } from "@rawswap/shared";

export type PoolVenue = LiquidityPoolEntry["venue"];

/** On-chain pool reference (Orca Whirlpool or Raydium CPMM pool state). */
export type PoolKey = Pick<LiquidityPoolEntry, "venue" | "address"> & {
  /** Tick spacing / fee tier hint for Orca; omit for Raydium until wired */
  tickSpacing?: number;
};

export type LiquidityPlan =
  | { venue: "orca_whirlpool"; pool: PoolKey; instructionsNote: string }
  | { venue: "raydium_cpmm"; pool: PoolKey; instructionsNote: string };
