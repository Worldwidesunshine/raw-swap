import { describe, expect, it } from "vitest";
import { DEBRIDGE_DLN_CREATE_TX, buildCreateTxUrl, buildOrderStateUrl } from "./create-tx-url.js";

describe("debridge create-tx-url", () => {
  it("builds create-tx URL with query params", () => {
    const u = buildCreateTxUrl({ srcChainId: "7565164", dstChainId: "1", account: "abc" });
    expect(u.startsWith(DEBRIDGE_DLN_CREATE_TX)).toBe(true);
    expect(u).toContain("srcChainId=");
    expect(u).toContain("7565164");
    expect(u).toContain("dstChainId=1");
    expect(u).toContain("account=abc");
  });

  it("omits empty-string query values", () => {
    const u = buildCreateTxUrl({ kept: "x", drop: "" });
    expect(u).toContain("kept=x");
    expect(u).not.toContain("drop=");
  });

  it("encodes spaces and non-ASCII via URLSearchParams", () => {
    const u = buildCreateTxUrl({ q: "a b", tag: "café" });
    const parsed = new URL(u);
    expect(parsed.searchParams.get("q")).toBe("a b");
    expect(parsed.searchParams.get("tag")).toBe("café");
  });

  it("builds order state URL", () => {
    expect(buildOrderStateUrl("ord_1")).toContain("/api/Orders/ord_1/state");
  });

  it("encodes order IDs with reserved characters", () => {
    expect(buildOrderStateUrl("a/b")).toContain("/api/Orders/a%2Fb/state");
  });
});
