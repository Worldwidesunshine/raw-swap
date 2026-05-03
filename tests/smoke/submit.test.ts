import { describe, it, expect } from "vitest";
import { url } from "./helpers.js";

describe("POST /api/submit", () => {
  it("returns 400 for missing body", async () => {
    const res = await fetch(url("/api/submit"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 for a well-formed but unknown build id", async () => {
    const res = await fetch(url("/api/submit"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buildId: "00000000-0000-0000-0000-000000000000",
        signedTransactionBase64: "AA==",
        executionMode: "fallback_rpc",
        allowFallback: false,
        idempotencyKey: "11111111-1111-4111-8111-111111111111",
      }),
    });
    expect(res.status).toBe(404);
  });
});
