import { afterEach, describe, expect, it, vi } from "vitest";
import { DebridgeCreateTxError, fetchDebridgeCreateTx } from "./fetch-create-tx.js";

describe("fetchDebridgeCreateTx", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GETs create-tx URL with JSON accept header and returns parsed body", async () => {
    const payload = { ok: true };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(""),
      json: vi.fn().mockResolvedValue(payload),
    } as unknown as Response);

    await expect(fetchDebridgeCreateTx({ chain: "1", extra: "2" })).resolves.toEqual(payload);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(typeof url).toBe("string");
    expect(url).toContain("create-tx");
    expect(url).toContain("chain=1");
    expect(url).toContain("extra=2");
    expect(init).toMatchObject({
      headers: { accept: "application/json" },
    });
  });

  it("maps non-OK responses to a sanitized error with upstream status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue('{"error":"invalid"}'),
      json: vi.fn(),
    } as unknown as Response);

    await expect(fetchDebridgeCreateTx({})).rejects.toMatchObject({
      name: "DebridgeCreateTxError",
      message: "deBridge create-tx request failed.",
      upstreamStatus: 400,
    } satisfies Partial<DebridgeCreateTxError>);
  });
});
