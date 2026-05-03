import { describe, expect, it } from "vitest";
import { executionTokenFor, url } from "./helpers.js";

describe("GET /api/report/:executionId", () => {
  it("returns 404 when no execution token is provided", async () => {
    const res = await fetch(url("/api/report/00000000-0000-0000-0000-000000000000"));
    expect(res.status).toBe(404);
  });

  it("returns 404 for non-existent execution", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await fetch(url(`/api/report/${fakeId}`), {
      headers: { "x-execution-token": executionTokenFor(fakeId) },
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("NOT_FOUND");
  });

  it("returns 404 for malformed id", async () => {
    const res = await fetch(url("/api/report/not-a-uuid"), {
      headers: { "x-execution-token": executionTokenFor("not-a-uuid") },
    });
    expect(res.status).toBe(404);
  });
});
