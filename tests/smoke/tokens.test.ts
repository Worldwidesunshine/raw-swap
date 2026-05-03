import { describe, expect, it } from "vitest";
import { JUP_MINT, url } from "./helpers.js";

describe("GET /api/tokens", () => {
  it("returns featured tokens without a query", async () => {
    const res = await fetch(url("/api/tokens"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("tokens");
    expect(Array.isArray(body.tokens)).toBe(true);
    expect(body.tokens.length).toBeGreaterThan(0);
  });

  it("returns an exact token match when queried by mint address", async () => {
    const res = await fetch(url(`/api/tokens?query=${encodeURIComponent(JUP_MINT)}`));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.tokens)).toBe(true);
    expect(body.tokens.some((token: { mint?: string }) => token.mint === JUP_MINT)).toBe(true);
  });
});
