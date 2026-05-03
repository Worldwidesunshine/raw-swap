/* eslint-disable no-console -- single JSON-line sink for ops / log aggregation */

type LogLevel = "info" | "warn" | "error";

export function compounderLogJson(level: LogLevel, msg: string, data?: Record<string, unknown>): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    svc: "compounder",
    level,
    msg,
    ...(data ?? {}),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  return { thrown: String(err) };
}
