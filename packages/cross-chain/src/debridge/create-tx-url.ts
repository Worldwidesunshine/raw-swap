/** Base URL for deBridge DLN `create-tx` (Wave 14–15). */
export const DEBRIDGE_DLN_CREATE_TX =
  "https://dln.debridge.finance/v1.0/dln/order/create-tx";

/** `GET /api/Orders/{orderId}/state` host (Wave 15). */
export const DEBRIDGE_ORDER_STATE_BASE = "https://dln.debridge.finance/v1.0";

/** Query parameters forwarded to DLN `create-tx`; empty-string values are omitted from the URL. */
export type DebridgeCreateTxParams = Record<string, string>;

export function buildCreateTxUrl(params: DebridgeCreateTxParams): string {
  const u = new URL(DEBRIDGE_DLN_CREATE_TX);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") u.searchParams.set(k, v);
  }
  return u.toString();
}

/** Order fulfillment polling (spec: GET /api/Orders/{orderId}/state). */
export function buildOrderStateUrl(orderId: string): string {
  return `${DEBRIDGE_ORDER_STATE_BASE}/api/Orders/${encodeURIComponent(orderId)}/state`;
}
