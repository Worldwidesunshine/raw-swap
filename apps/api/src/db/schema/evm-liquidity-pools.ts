import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const evmLiquidityPools = pgTable("evm_liquidity_pools", {
  id: uuid("id").primaryKey().defaultRandom(),
  chain: text("chain").notNull(),
  dex: text("dex").notNull(),
  poolAddress: text("pool_address").notNull(),
  token0: text("token0").notNull(),
  token1: text("token1").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
