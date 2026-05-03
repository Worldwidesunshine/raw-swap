import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const lpPositions = pgTable("lp_positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletPublicKey: text("wallet_public_key").notNull(),
  venue: text("venue").notNull(),
  poolAddress: text("pool_address").notNull(),
  chain: text("chain").notNull().default("solana"),
  positionMint: text("position_mint"),
  liquidityRaw: text("liquidity_raw"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
