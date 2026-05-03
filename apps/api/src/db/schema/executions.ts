import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  jsonb,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { transactionBuilds } from "./transaction-builds.js";

export const executions = pgTable(
  "executions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    buildId: uuid("build_id")
      .references(() => transactionBuilds.id)
      .notNull(),
    idempotencyKey: text("idempotency_key"),
    signature: text("signature"),
    bundleId: text("bundle_id"),
    signedTransactionBase64: text("signed_transaction_base64"),
    signedMessageHash: text("signed_message_hash"),
    status: text("status").notNull(),
    submittedVia: text("submitted_via"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    landedAt: timestamp("landed_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    expiredAt: timestamp("expired_at", { withTimezone: true }),
    submittedSlot: bigint("submitted_slot", { mode: "number" }),
    landedSlot: bigint("landed_slot", { mode: "number" }),
    slotsToLand: integer("slots_to_land"),
    sendLatencyMs: integer("send_latency_ms"),
    timeToLandMs: integer("time_to_land_ms"),
    failureReason: text("failure_reason"),
    errorCode: text("error_code"),
    priorityFeeLamports: bigint("priority_fee_lamports", { mode: "number" }),
    jitoTipLamports: bigint("jito_tip_lamports", { mode: "number" }),
    protocolFeeLamports: bigint("protocol_fee_lamports", { mode: "number" }),
    treasuryFeeLamports: bigint("treasury_fee_lamports", { mode: "number" }),
    actualOutputAmount: text("actual_output_amount"),
    realizedSlippageBps: integer("realized_slippage_bps"),
    rawStatusJson: jsonb("raw_status_json"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    sigUnique: uniqueIndex("executions_signature_unique").on(t.signature),
    buildIdemUnique: uniqueIndex("executions_build_idempotency_unique").on(
      t.buildId,
      t.idempotencyKey,
    ),
  }),
);
