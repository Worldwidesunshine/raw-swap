import {
  createHmac,
  createPublicKey,
  timingSafeEqual,
  verify as verifySignature,
} from "node:crypto";
import { PublicKey } from "@solana/web3.js";
import type { FastifyRequest } from "fastify";
import {
  WALLET_SESSION_MAX_CLOCK_SKEW_MS,
  WALLET_SESSION_TTL_MS,
  buildWalletSessionMessage,
} from "@rawswap/shared";

type WalletSessionPayload = {
  walletPublicKey: string;
  exp: number;
};

const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function asBuffer(value: string) {
  return Buffer.from(value, "utf8");
}

function signWalletSessionPayload(payloadBase64Url: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`wallet-session.${payloadBase64Url}`)
    .digest("base64url");
}

export function issueWalletSessionToken(
  walletPublicKey: string,
  secret: string,
  now = Date.now(),
): { token: string; expiresAt: string } {
  const payload: WalletSessionPayload = {
    walletPublicKey,
    exp: now + WALLET_SESSION_TTL_MS,
  };
  const payloadBase64Url = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signWalletSessionPayload(payloadBase64Url, secret);
  return {
    token: `${payloadBase64Url}.${signature}`,
    expiresAt: new Date(payload.exp).toISOString(),
  };
}

export function readWalletSessionToken(request: FastifyRequest): string | null {
  const headerToken = request.headers["x-wallet-session-token"];
  if (typeof headerToken === "string" && headerToken.length > 0) return headerToken;
  return null;
}

export function readWalletFromSession(request: FastifyRequest, secret: string): string | null {
  const token = readWalletSessionToken(request);
  if (!token) return null;
  const [payloadBase64Url, signature] = token.split(".");
  if (!payloadBase64Url || !signature) return null;

  const expectedSignature = signWalletSessionPayload(payloadBase64Url, secret);
  const expectedBuffer = asBuffer(expectedSignature);
  const actualBuffer = asBuffer(signature);
  if (expectedBuffer.length !== actualBuffer.length) return null;
  if (!timingSafeEqual(expectedBuffer, actualBuffer)) return null;

  let payload: WalletSessionPayload;
  try {
    payload = JSON.parse(
      Buffer.from(payloadBase64Url, "base64url").toString("utf8"),
    ) as WalletSessionPayload;
  } catch {
    return null;
  }
  if (
    typeof payload.walletPublicKey !== "string" ||
    typeof payload.exp !== "number" ||
    payload.exp <= Date.now()
  ) {
    return null;
  }
  return payload.walletPublicKey;
}

export function verifyWalletSessionSignature(args: {
  walletPublicKey: string;
  issuedAt: number;
  signatureBase64: string;
}): boolean {
  if (Math.abs(Date.now() - args.issuedAt) > WALLET_SESSION_MAX_CLOCK_SKEW_MS) {
    return false;
  }

  const message = buildWalletSessionMessage({
    walletPublicKey: args.walletPublicKey,
    issuedAt: args.issuedAt,
  });
  let publicKey: PublicKey;
  let signature: Buffer;
  try {
    publicKey = new PublicKey(args.walletPublicKey);
    signature = Buffer.from(args.signatureBase64, "base64");
  } catch {
    return false;
  }

  try {
    const key = createPublicKey({
      key: Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(publicKey.toBytes())]),
      format: "der",
      type: "spki",
    });
    return verifySignature(null, Buffer.from(message, "utf8"), key, signature);
  } catch {
    return false;
  }
}
