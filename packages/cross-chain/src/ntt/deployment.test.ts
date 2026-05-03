import { describe, expect, it } from "vitest";
import { nttDeploymentFileSchema } from "./deployment.js";

describe("nttDeploymentFileSchema", () => {
  it("allows an empty object", () => {
    expect(nttDeploymentFileSchema.parse({})).toEqual({});
  });

  it("parses hub, chains, and rateLimits", () => {
    const data = {
      version: "1",
      hub: "solana" as const,
      chains: [
        { chainId: 7565164, manager: "mgr", token: "tkn", mode: "burning" as const },
      ],
      rateLimits: [{ chainId: 1, outboundLimit: "100", inboundLimit: "200" }],
    };
    expect(nttDeploymentFileSchema.parse(data)).toEqual(data);
  });

  it("rejects invalid hub value", () => {
    expect(() =>
      nttDeploymentFileSchema.parse({
        hub: "ethereum",
      }),
    ).toThrow();
  });

  it("rejects invalid chain transfer mode", () => {
    expect(() =>
      nttDeploymentFileSchema.parse({
        chains: [{ chainId: 1, mode: "minting" }],
      }),
    ).toThrow();
  });

  it("rejects non-integer chainId", () => {
    expect(() =>
      nttDeploymentFileSchema.parse({
        chains: [{ chainId: 1.5 }],
      }),
    ).toThrow();
  });
});
