import { describe, expect, it } from "vitest";
import { RawSwapError } from "@rawswap/shared";
import { JupiterApiError } from "../clients/jupiter.js";
import { normalizeUpstreamError } from "./upstream-errors.js";

describe("normalizeUpstreamError", () => {
  it("preserves existing RawSwapError instances", () => {
    const existing = new RawSwapError("QUOTE_FAILED", {
      details: { upstreamStatus: 502 },
    });

    expect(normalizeUpstreamError(existing, "QUOTE_FAILED", "Jupiter", "quote")).toBe(existing);
  });

  it("maps provider transport failures to QUOTE_FAILED", () => {
    const error = normalizeUpstreamError(
      new Error("socket hang up"),
      "QUOTE_FAILED",
      "Jupiter",
      "quote",
    );

    expect(error.shape.code).toBe("QUOTE_FAILED");
    expect(error.shape.message).toBe("Jupiter quote request failed.");
    expect(error.shape.details).toEqual({
      provider: "Jupiter",
      action: "quote",
      cause: "Error: socket hang up",
    });
  });

  it("maps 400 no-route responses to UNSUPPORTED_PAIR", () => {
    const error = normalizeUpstreamError(
      new JupiterApiError("Jupiter quote failed with HTTP 400.", {
        requestUrl: "https://api.jup.ag/swap/v2/build",
        upstreamStatus: 400,
        responseSnippet: "{\"error\":\"COULD_NOT_FIND_ANY_ROUTE\"}",
      }),
      "QUOTE_FAILED",
      "Jupiter",
      "quote",
    );

    expect(error.shape.code).toBe("UNSUPPORTED_PAIR");
    expect(error.shape.details).toMatchObject({
      upstreamStatus: 400,
      provider: "Jupiter",
      action: "quote",
    });
  });

  it("maps 400 invalid amount responses to INVALID_AMOUNT", () => {
    const error = normalizeUpstreamError(
      new JupiterApiError("Jupiter quote failed with HTTP 400.", {
        requestUrl: "https://api.jup.ag/swap/v2/build",
        upstreamStatus: 400,
        responseSnippet: "{\"error\":\"input amount too small\"}",
      }),
      "QUOTE_FAILED",
      "Jupiter",
      "quote",
    );

    expect(error.shape.code).toBe("INVALID_AMOUNT");
    expect(error.shape.details).toMatchObject({
      upstreamStatus: 400,
      provider: "Jupiter",
      action: "quote",
    });
  });

  it("maps build provider errors to BUILD_FAILED with upstream metadata", () => {
    const error = normalizeUpstreamError(
      new JupiterApiError("Jupiter build failed with HTTP 429.", {
        requestUrl: "https://api.jup.ag/swap/v2/build",
        upstreamStatus: 429,
        responseSnippet: "rate limit",
      }),
      "BUILD_FAILED",
      "Jupiter",
      "build",
    );

    expect(error.shape.code).toBe("BUILD_FAILED");
    expect(error.shape.message).toBe("Jupiter build request failed.");
    expect(error.shape.details).toMatchObject({
      upstreamStatus: 429,
      provider: "Jupiter",
      action: "build",
    });
    expect(error.shape.details).not.toHaveProperty("requestUrl");
    expect(error.shape.details).not.toHaveProperty("responseSnippet");
  });
});
