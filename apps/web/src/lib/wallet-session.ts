"use client";

import type { WalletSessionResponse } from "@rawswap/shared";
import {
  WALLET_SESSION_MAX_CLOCK_SKEW_MS,
  buildWalletSessionMessage,
} from "@rawswap/shared";
import { postWalletSession } from "./api-client";

type WalletSigner = {
  walletPublicKey: string;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
};

function storageKey(walletPublicKey: string) {
  return `rawswap:wallet-session:${walletPublicKey}`;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function getCachedWalletSession(walletPublicKey: string): WalletSessionResponse | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(storageKey(walletPublicKey));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as WalletSessionResponse;
    const expiresAtMs = Date.parse(parsed.expiresAt);
    if (!parsed.walletSessionToken || Number.isNaN(expiresAtMs)) {
      window.localStorage.removeItem(storageKey(walletPublicKey));
      return null;
    }
    if (expiresAtMs <= Date.now() + WALLET_SESSION_MAX_CLOCK_SKEW_MS) {
      window.localStorage.removeItem(storageKey(walletPublicKey));
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(storageKey(walletPublicKey));
    return null;
  }
}

export async function ensureWalletSession(signer: WalletSigner): Promise<WalletSessionResponse> {
  const cached = getCachedWalletSession(signer.walletPublicKey);
  if (cached) return cached;

  const issuedAt = Date.now();
  const message = buildWalletSessionMessage({
    walletPublicKey: signer.walletPublicKey,
    issuedAt,
  });
  const signature = await signer.signMessage(new TextEncoder().encode(message));
  const session = await postWalletSession({
    walletPublicKey: signer.walletPublicKey,
    issuedAt,
    signatureBase64: bytesToBase64(signature),
  });
  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey(signer.walletPublicKey), JSON.stringify(session));
  }
  return session;
}
