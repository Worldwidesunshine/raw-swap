import {
  pgTable,
  uuid,
  boolean,
  bigint,
  integer,
  jsonb,
  timestamp,
  text,
} from "drizzle-orm/pg-core";
import { transactionBuilds } from "./transaction-builds.js";

export const simulations = pgTable("simulations", {
  id: uuid("id").primaryKey().defaultRandom(),
  buildId: uuid("build_id")
    .references(() => transactionBuilds.id)
    .notNull(),
  ok: boolean("ok").notNull(),
  unitsConsumed: bigint("units_consumed", { mode: "number" }),
  errorJson: jsonb("error_json"),
  logs: jsonb("logs"),
  riskFlags: text("risk_flags").array(),
  simulationMs: integer("simulation_ms"),
  simulatedTransactionHash: text("simulated_transaction_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
