import { pgTable, uuid, text, timestamp, jsonb, bigint } from "drizzle-orm/pg-core";
import { quotes } from "./quotes.js";

export const transactionBuilds = pgTable("transaction_builds", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id")
    .references(() => quotes.id)
    .notNull(),
  userPublicKey: text("user_public_key").notNull(),
  unsignedTransactionBase64: text("unsigned_transaction_base64").notNull(),
  transactionMessageHash: text("transaction_message_hash").notNull(),
  recentBlockhash: text("recent_blockhash").notNull(),
  lastValidBlockHeight: bigint("last_valid_block_height", { mode: "number" }),
  urgency: text("urgency").notNull(),
  executionMode: text("execution_mode").notNull(),
  estimatedPriorityFeeLamports: bigint("estimated_priority_fee_lamports", { mode: "number" }),
  estimatedJitoTipLamports: bigint("estimated_jito_tip_lamports", { mode: "number" }),
  estimatedProtocolBuybackFeeLamports: bigint("estimated_protocol_buyback_fee_lamports", {
    mode: "number",
  }),
  estimatedProtocolTreasuryFeeLamports: bigint("estimated_protocol_treasury_fee_lamports", {
    mode: "number",
  }),
  expectedSigners: jsonb("expected_signers").notNull(),
  instructionProgramIds: jsonb("instruction_program_ids").notNull(),
  lookupTableAccounts: jsonb("lookup_table_accounts"),
  buildMetadata: jsonb("build_metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
