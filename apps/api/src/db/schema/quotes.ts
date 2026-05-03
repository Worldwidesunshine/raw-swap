import { pgTable, uuid, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userPublicKey: text("user_public_key").notNull(),
  inputMint: text("input_mint").notNull(),
  outputMint: text("output_mint").notNull(),
  inputAmount: text("input_amount").notNull(),
  expectedOutputAmount: text("expected_output_amount").notNull(),
  minimumOutputAmount: text("minimum_output_amount").notNull(),
  slippageBps: integer("slippage_bps").notNull(),
  priceImpactPct: text("price_impact_pct"),
  routeJson: jsonb("route_json").notNull(),
  provider: text("provider").notNull().default("jupiter"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
