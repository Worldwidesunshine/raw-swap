import { createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyRequest } from "fastify";

function asBuffer(value: string) {
  return Buffer.from(value, "utf8");
}

export function issueExecutionAccessToken(executionId: string, secret: string): string {
  return createHmac("sha256", secret).update(executionId).digest("base64url");
}

export function readExecutionAccessToken(request: FastifyRequest): string | null {
  const headerToken = request.headers["x-execution-token"];
  if (typeof headerToken === "string" && headerToken.length > 0) return headerToken;

  const auth = request.headers.authorization;
  if (!auth) return null;
  const [scheme, token] = auth.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export function hasExecutionAccess(
  executionId: string,
  token: string | null,
  secret: string,
): boolean {
  if (!token) return false;
  const expected = issueExecutionAccessToken(executionId, secret);
  const expectedBuffer = asBuffer(expected);
  const tokenBuffer = asBuffer(token);
  if (expectedBuffer.length !== tokenBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, tokenBuffer);
}
