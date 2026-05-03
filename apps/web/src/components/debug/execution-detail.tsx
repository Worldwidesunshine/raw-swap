"use client";

/** Reserved for per-execution drill-down UI */
export function ExecutionDetail({ executionId }: { executionId: string | null }) {
  if (!executionId) return null;
  return <div className="text-xs text-slate-500">Execution: {executionId}</div>;
}
