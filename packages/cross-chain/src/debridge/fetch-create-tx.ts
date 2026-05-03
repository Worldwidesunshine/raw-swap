import { buildCreateTxUrl, type DebridgeCreateTxParams } from "./create-tx-url.js";

export class DebridgeCreateTxError extends Error {
  constructor(
    message: string,
    readonly upstreamStatus?: number,
  ) {
    super(message);
    this.name = "DebridgeCreateTxError";
  }
}

/** GET deBridge DLN `create-tx` and parse JSON response. */
export async function fetchDebridgeCreateTx(
  params: DebridgeCreateTxParams,
  opts: { timeoutMs?: number } = {},
): Promise<unknown> {
  const url = buildCreateTxUrl(params);
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(opts.timeoutMs ?? 10_000),
  });
  if (!res.ok) {
    throw new DebridgeCreateTxError("deBridge create-tx request failed.", res.status);
  }
  try {
    return await res.json();
  } catch {
    throw new DebridgeCreateTxError("deBridge create-tx returned invalid JSON.", res.status);
  }
}
