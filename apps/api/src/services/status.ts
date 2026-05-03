import { eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { executions } from "../db/schema/executions.js";

export async function getExecutionStatus(executionId: string) {
  const rows = await getDb().select().from(executions).where(eq(executions.id, executionId)).limit(1);
  const ex = rows[0];
  if (!ex) return null;
  return {
    executionId: ex.id,
    signature: ex.signature,
    bundleId: ex.bundleId,
    status: ex.status,
    submittedVia: ex.submittedVia,
    submittedAt: ex.submittedAt?.toISOString() ?? null,
    landedAt: ex.landedAt?.toISOString() ?? null,
    slotsToLand: ex.slotsToLand,
    errorCode: ex.errorCode,
  };
}
