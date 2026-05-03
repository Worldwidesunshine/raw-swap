import { describe, expect, it } from "vitest";
import { amountSchema, base58PublicKeySchema, mintSchema, slippageBpsSchema } from "./common.js";

describe("common schemas", () => {
  it("amountSchema accepts positive integer strings without leading zeros", () => {
    expect(amountSchema.parse("1")).toBe("1");
    expect(amountSchema.parse("42")).toBe("42");
    expect(() => amountSchema.parse("0")).toThrow();
    expect(() => amountSchema.parse("01")).toThrow();
    expect(() => amountSchema.parse("")).toThrow();
    expect(() => amountSchema.parse("abc")).toThrow();
  });

  it("slippageBpsSchema accepts 0..10000", () => {
    expect(slippageBpsSchema.parse(0)).toBe(0);
    expect(slippageBpsSchema.parse(10000)).toBe(10000);
    expect(() => slippageBpsSchema.parse(-1)).toThrow();
    expect(() => slippageBpsSchema.parse(10001)).toThrow();
    expect(() => slippageBpsSchema.parse(1.5)).toThrow();
  });

  it("mintSchema matches base58 public key rules", () => {
    const pk = "11111111111111111111111111111111";
    expect(mintSchema.parse(pk)).toBe(pk);
    expect(base58PublicKeySchema).toBe(mintSchema);
    expect(() => mintSchema.parse("")).toThrow();
    expect(() => mintSchema.parse("0invalidcharsnotbase58!!!")).toThrow();
  });
});
