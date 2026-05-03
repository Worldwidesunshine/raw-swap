import { createHmac } from "node:crypto";

const API_URL = process.env.SMOKE_API_URL ?? "http://localhost:3001";
const EXECUTION_TOKEN_SECRET =
  process.env.SMOKE_EXECUTION_TOKEN_SECRET ?? "rawswap-smoke-test-secret";

export const TEST_USER_PUBLIC_KEY = "11111111111111111111111111111112";
export const SOL_MINT = "So11111111111111111111111111111111111111112";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const JUP_MINT = "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN";

export function url(path: string): string {
  return `${API_URL}${path}`;
}

export function executionTokenFor(executionId: string): string {
  return createHmac("sha256", EXECUTION_TOKEN_SECRET).update(executionId).digest("base64url");
}

export async function retry<T>(
  fn: () => Promise<T>,
  { attempts = 10, delayMs = 500 } = {},
): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw last;
}
