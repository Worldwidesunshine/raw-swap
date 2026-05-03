import { pgTable, uuid, text, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

export const liquidityPools = pgTable("liquidity_pools", {
  id: uuid("id").primaryKey().defaultRandom(),
  venue: text("venue").notNull(),
  chain: text("chain").notNull().default("solana"),
  poolAddress: text("pool_address").notNull(),
  mintA: text("mint_a").notNull(),
  mintB: text("mint_b").notNull(),
  feeTierBps: integer("fee_tier_bps"),
  tvlUsdEstimate: text("tvl_usd_estimate"),
  isProtocolOwned: boolean("is_protocol_owned").notNull().default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
