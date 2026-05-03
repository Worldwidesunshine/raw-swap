import { describe, expect, it } from "vitest";
import { RawSwapError } from "@rawswap/shared";
import { normalizeSubmissionFailure } from "./submit.js";

describe("normalizeSubmissionFailure", () => {
  it("maps rpc submission failures to RPC_FALLBACK_FAILED", () => {
    const error = normalizeSubmissionFailure(new Error("rpc unavailable"), "rpc");
    expect(error.shape.code).toBe("RPC_FALLBACK_FAILED");
    expect(error.shape.details).toEqual({ cause: "Error: rpc unavailable" });
  });

  it("maps jito submission failures to JITO_SUBMIT_FAILED", () => {
    const error = normalizeSubmissionFailure(new Error("jito unavailable"), "jito");
    expect(error.shape.code).toBe("JITO_SUBMIT_FAILED");
    expect(error.shape.details).toEqual({ cause: "Error: jito unavailable" });
  });

  it("preserves existing submission error codes", () => {
    const existing = new RawSwapError("RPC_FALLBACK_FAILED", {
      details: { cause: "signature mismatch" },
    });
    expect(normalizeSubmissionFailure(existing, "jito")).toBe(existing);
  });
});
