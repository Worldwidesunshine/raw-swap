import { describe, it, expect } from "vitest";
import { JUP_MINT, SOL_MINT, TEST_USER_PUBLIC_KEY, USDC_MINT, url } from "./helpers.js";

describe("POST /api/quote", () => {
  it("returns 400 for missing body fields", async () => {
    const res = await fetch(url("/api/quote"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid mint address", async () => {
    const res = await fetch(url("/api/quote"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputMint: "not-a-real-mint",
        outputMint: "also-bad",
        amount: "1000000",
        slippageBps: 50,
        userPublicKey: TEST_USER_PUBLIC_KEY,
      }),
    });
    expect(res.status).toBe(400);
  });

  it("returns a quote for valid SOL->USDC params (live RPC)", async () => {
    const res = await fetch(url("/api/quote"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputMint: SOL_MINT,
        outputMint: USDC_MINT,
        amount: "1000000",
        slippageBps: 50,
        userPublicKey: TEST_USER_PUBLIC_KEY,
      }),
    });

    if (res.status === 200) {
      const body = await res.json();
      expect(body).toHaveProperty("quoteId");
      expect(body).toHaveProperty("outAmount");
      expect(body).toHaveProperty("routeSummary");
      expect(body).toHaveProperty("rawProviderQuote");
    } else {
      // Jupiter may be unreachable in CI — this is acceptable as a non-blocking check
      expect([502, 503, 504]).toContain(res.status);
    }
  });

  it("returns a quote for a non-default Jupiter-routed token when upstream is available", async () => {
    const res = await fetch(url("/api/quote"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputMint: SOL_MINT,
        outputMint: JUP_MINT,
        amount: "1000000",
        slippageBps: 50,
        userPublicKey: TEST_USER_PUBLIC_KEY,
      }),
    });

    if (res.status === 200) {
      const body = await res.json();
      expect(body.outputToken?.mint).toBe(JUP_MINT);
      expect(body.outputToken?.symbol).toBe("JUP");
      expect(body).toHaveProperty("outAmountUi");
    } else {
      expect([502, 503, 504]).toContain(res.status);
    }
  });
});
