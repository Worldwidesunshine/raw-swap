import { pgTable, uuid, text, bigint, jsonb, timestamp } from "drizzle-orm/pg-core";

export const protocolFeeDeployments = pgTable("protocol_fee_deployments", {
  id: uuid("id").primaryKey().defaultRandom(),
  txSignature: text("tx_signature"),
  deploymentType: text("deployment_type").notNull(),
  buybackSolLamports: bigint("buyback_sol_lamports", { mode: "number" }),
  rawswapAmount: text("rawswap_amount"),
  orcaPoolAddress: text("orca_pool_address"),
  raydiumPoolAddress: text("raydium_pool_address"),
  status: text("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
