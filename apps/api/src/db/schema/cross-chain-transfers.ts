import { index, pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const crossChainTransfers = pgTable("cross_chain_transfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider").notNull(),
  orderId: text("order_id"),
  sourceChain: text("source_chain").notNull(),
  destChain: text("dest_chain").notNull(),
  status: text("status").notNull(),
  amountIn: text("amount_in"),
  amountOut: text("amount_out"),
  mintIn: text("mint_in"),
  mintOut: text("mint_out"),
  walletPublicKey: text("wallet_public_key"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  orderIdIdx: index("idx_cct_order_id").on(table.orderId),
  walletIdx: index("idx_cct_wallet").on(table.walletPublicKey),
}));

