export const WALLET_SESSION_TTL_MS = 15 * 60 * 1000;
export const WALLET_SESSION_MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

export function buildWalletSessionMessage(args: {
  walletPublicKey: string;
  issuedAt: number;
}): string {
  return [
    "RawSwap wallet session",
    `wallet:${args.walletPublicKey}`,
    `issuedAt:${args.issuedAt}`,
    "scope:cross-chain",
  ].join("\n");
}
