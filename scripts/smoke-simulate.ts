#!/usr/bin/env node
/**
 * Smoke: rely on wallet + API — placeholder for future local simulation helper.
 * For now, hit /ready to verify API is up.
 */
const base = process.env.API_URL ?? "http://localhost:3001";
const r = await fetch(`${base}/ready`);
console.log("ready", r.status, await r.text());
