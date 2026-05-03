import type { LiquidityPoolEntry } from "@rawswap/shared";

function venueKey(dbVenue: string): string {
  return dbVenue.trim().toLowerCase().replace(/\s+/g, "_");
}

/**
 * Map DB / config venue strings to canonical {@link LiquidityPoolEntry} venue values.
 */
export function normalizeVenue(dbVenue: string): "orca_whirlpool" | "raydium_cpmm" | null {
  switch (venueKey(dbVenue)) {
    case "orca_whirlpool":
    case "orca":
    case "orca_whirlpools":
    case "whirlpool":
    case "whirlpools":
      return "orca_whirlpool";
    case "raydium_cpmm":
    case "raydium":
    case "raydium_cpmm_pool":
    case "cpmm":
    case "raydium_cp":
      return "raydium_cpmm";
    default:
      return null;
  }
}

function shortMint(mint: string): string {
  if (mint.length <= 9) return mint;
  return `${mint.slice(0, 4)}…${mint.slice(-4)}`;
}

function labelFromRow(mintA: string, mintB: string, feeTierBps?: number | null): string {
  const pair = `${shortMint(mintA)} / ${shortMint(mintB)}`;
  if (feeTierBps != null && Number.isFinite(feeTierBps)) {
    return `${pair} (${feeTierBps} bps)`;
  }
  return pair;
}

/** Build an API {@link LiquidityPoolEntry} from a `liquidity_pools`-style row. */
export function poolRowFromDbShape(row: {
  venue: string;
  poolAddress: string;
  mintA: string;
  mintB: string;
  feeTierBps?: number | null;
}): LiquidityPoolEntry {
  const venue = normalizeVenue(row.venue);
  if (venue == null) {
    throw new Error(`Unknown liquidity venue: ${JSON.stringify(row.venue)}`);
  }
  return {
    venue,
    address: row.poolAddress,
    label: labelFromRow(row.mintA, row.mintB, row.feeTierBps),
  };
}
