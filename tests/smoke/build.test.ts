import { describe, it, expect } from "vitest";
import { JUP_MINT, SOL_MINT, TEST_USER_PUBLIC_KEY, USDC_MINT, url } from "./helpers.js";

describe("POST /api/build", () => {
  it("returns 400 for missing body fields", async () => {
    const res = await fetch(url("/api/build"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid wallet address", async () => {
    const res = await fetch(url("/api/build"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteId: "00000000-0000-0000-0000-000000000000",
        userPublicKey: "not-a-pubkey",
        urgency: "normal",
        executionMode: "jito_single_tx",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("builds from a live quote when upstream is available", async () => {
    const quoteRes = await fetch(url("/api/quote"), {
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

    if (quoteRes.status !== 200) {
      expect([502, 503, 504]).toContain(quoteRes.status);
      return;
    }

    const quoteBody = (await quoteRes.json()) as { quoteId: string };
    const buildRes = await fetch(url("/api/build"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteId: quoteBody.quoteId,
        userPublicKey: TEST_USER_PUBLIC_KEY,
        urgency: "normal",
        executionMode: "fallback_rpc",
      }),
    });

    if (buildRes.status === 200) {
      const buildBody = await buildRes.json();
      expect(buildBody).toHaveProperty("buildId");
      expect(buildBody).toHaveProperty("unsignedTransactionBase64");
      expect(buildBody).toHaveProperty("userReview");
    } else {
      expect([502, 503, 504]).toContain(buildRes.status);
    }
  });

  it("preserves arbitrary token metadata in build review", async () => {
    const quoteRes = await fetch(url("/api/quote"), {
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

    if (quoteRes.status !== 200) {
      expect([502, 503, 504]).toContain(quoteRes.status);
      return;
    }

    const quoteBody = (await quoteRes.json()) as { quoteId: string };
    const buildRes = await fetch(url("/api/build"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteId: quoteBody.quoteId,
        userPublicKey: TEST_USER_PUBLIC_KEY,
        urgency: "normal",
        executionMode: "fallback_rpc",
      }),
    });

    if (buildRes.status === 200) {
      const buildBody = await buildRes.json();
      expect(buildBody.userReview?.outputMint).toBe(JUP_MINT);
      expect(buildBody.userReview?.outputSymbol).toBe("JUP");
      expect(buildBody.userReview).toHaveProperty("expectedOutputUi");
    } else {
      expect([502, 503, 504]).toContain(buildRes.status);
    }
  });
});
