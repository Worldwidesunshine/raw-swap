import { pgTable, uuid, text, bigint, jsonb, timestamp } from "drizzle-orm/pg-core";

export const rewardsEpochs = pgTable("rewards_epochs", {
  id: uuid("id").primaryKey().defaultRandom(),
  chain: text("chain").notNull(),
  epochIndex: bigint("epoch_index", { mode: "number" }).notNull(),
  totalRawswapAllocated: text("total_rawswap_allocated").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
