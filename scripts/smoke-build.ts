#!/usr/bin/env node
/**
 * Smoke: POST /api/build — requires a valid quoteId from a prior /api/quote call.
 * Usage:
 *   API_URL=http://localhost:3001 QUOTE_ID=<uuid> USER_PK=<base58> tsx scripts/smoke-build.ts
 */
const base = process.env.API_URL ?? "http://localhost:3001";
const quoteId = process.env.QUOTE_ID;
const userPublicKey = process.env.USER_PK;
if (!quoteId || !userPublicKey) {
  console.error("Set QUOTE_ID and USER_PK (base58 wallet pubkey).");
  process.exit(1);
}
const body = {
  quoteId,
  userPublicKey,
  urgency: "normal",
  executionMode: "jito_single_tx",
};
const r = await fetch(`${base}/api/build`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});
const text = await r.text();
console.log("build", r.status, text.slice(0, 500));
