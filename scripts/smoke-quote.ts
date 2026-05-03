#!/usr/bin/env node
/** Smoke: liveness + readiness */
const base = process.env.API_URL ?? "http://localhost:3001";
for (const path of ["/health", "/ready"]) {
  const r = await fetch(`${base}${path}`);
  console.log(path, r.status, await r.text());
}
