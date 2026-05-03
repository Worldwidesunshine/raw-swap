import { pgTable, uuid, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export const tokenRiskSnapshots = pgTable("token_risk_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  mint: text("mint").notNull(),
  tokenProgram: text("token_program").notNull(),
  decimals: integer("decimals"),
  freezeAuthority: text("freeze_authority"),
  mintAuthority: text("mint_authority"),
  token2022Extensions: jsonb("token_2022_extensions"),
  riskFlags: text("risk_flags").array(),
  source: text("source").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
