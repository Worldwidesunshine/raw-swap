#!/usr/bin/env node
/**
 * Smoke: POST /api/submit — requires a completed build + signed tx (normally from wallet).
 * Documented placeholder; supply all fields for a manual run.
 */
const base = process.env.API_URL ?? "http://localhost:3001";
const buildId = process.env.BUILD_ID;
const signed = process.env.SIGNED_TX_B64;
const idem = process.env.IDEMPOTENCY_KEY;
if (!buildId || !signed || !idem) {
  console.error("Set BUILD_ID, SIGNED_TX_B64 (base64), IDEMPOTENCY_KEY (uuid).");
  process.exit(1);
}
const body = {
  buildId,
  signedTransactionBase64: signed,
  executionMode: "jito_single_tx",
  allowFallback: true,
  idempotencyKey: idem,
};
const r = await fetch(`${base}/api/submit`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});
const text = await r.text();
console.log("submit", r.status, text.slice(0, 500));
