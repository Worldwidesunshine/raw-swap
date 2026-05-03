import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { executions } from "./executions.js";

export const executionEvents = pgTable("execution_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  executionId: uuid("execution_id")
    .references(() => executions.id)
    .notNull(),
  eventType: text("event_type").notNull(),
  eventJson: jsonb("event_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
