import { timingSafeEqual } from "node:crypto";
import type { FastifyRequest } from "fastify";

function asBuffer(value: string) {
  return Buffer.from(value, "utf8");
}

export function readInternalAccessToken(request: FastifyRequest): string | null {
  const headerToken = request.headers["x-internal-access-token"];
  if (typeof headerToken === "string" && headerToken.length > 0) return headerToken;

  const auth = request.headers.authorization;
  if (!auth) return null;
  const [scheme, token] = auth.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export function hasInternalAccess(request: FastifyRequest, expectedToken: string): boolean {
  const token = readInternalAccessToken(request);
  if (!token) return false;
  const expectedBuffer = asBuffer(expectedToken);
  const tokenBuffer = asBuffer(token);
  if (expectedBuffer.length !== tokenBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, tokenBuffer);
}
