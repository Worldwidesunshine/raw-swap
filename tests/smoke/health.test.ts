import { describe, it, expect } from "vitest";
import { url, retry } from "./helpers.js";

describe("Health & readiness", () => {
  it("GET /health returns 200", async () => {
    const res = await retry(() => fetch(url("/health")));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it("GET /ready returns 200 when deps are up", async () => {
    const res = await retry(() => fetch(url("/ready")));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.postgres).toBe(true);
    expect(body.redis).toBe(true);
  });
});
