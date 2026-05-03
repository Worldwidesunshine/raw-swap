import { describe, expect, it } from "vitest";
import { hasExecutionAccess, issueExecutionAccessToken } from "./execution-access.js";

describe("execution access token", () => {
  it("grants access only for the matching execution id and secret", () => {
    const executionId = "8f0a3439-58e2-4c0d-a245-18d3e8d79d40";
    const secret = "test-secret-that-is-long-enough";
    const token = issueExecutionAccessToken(executionId, secret);

    expect(hasExecutionAccess(executionId, token, secret)).toBe(true);
    expect(hasExecutionAccess(executionId, `${token}x`, secret)).toBe(false);
    expect(hasExecutionAccess("863d1afb-a53b-4bc0-8ffa-e15e9e401f67", token, secret)).toBe(false);
  });
});
