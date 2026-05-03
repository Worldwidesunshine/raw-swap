import { SOL_MINT, USDC_MINT, type SwapToken } from "@rawswap/shared";

const UI_AMOUNT_PATTERN = /^\d*(?:\.\d*)?$/;
const MINT_ADDRESS_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const RECENT_TOKENS_STORAGE_KEY = "rawswap.recentTokens";
const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const LEGACY_TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const MAX_RECENT_TOKENS = 8;

export const DEFAULT_INPUT_TOKEN: SwapToken = {
  mint: SOL_MINT,
  symbol: "SOL",
  name: "Solana",
  decimals: 9,
  icon: null,
  isNative: true,
  isVerified: true,
  tokenProgram: "native",
  organicScore: null,
  tags: ["allowlisted"],
};

export const DEFAULT_OUTPUT_TOKEN: SwapToken = {
  mint: USDC_MINT,
  symbol: "USDC",
  name: "USD Coin",
  decimals: 6,
  icon: null,
  isNative: false,
  isVerified: true,
  tokenProgram: "spl-token",
  organicScore: null,
  tags: ["allowlisted"],
};

export function oneTokenUiAmount(): string {
  return "1";
}

export function isUiAmountInput(value: string): boolean {
  return UI_AMOUNT_PATTERN.test(value);
}

export function looksLikeMintAddress(value: string): boolean {
  return MINT_ADDRESS_PATTERN.test(value.trim());
}

export function uiAmountToBaseUnits(value: string, decimals: number): string | null {
  const trimmed = value.trim();
  if (!trimmed || !UI_AMOUNT_PATTERN.test(trimmed)) return null;

  const [wholePartRaw = "0", fractionPart = ""] = trimmed.split(".");
  if (fractionPart.length > decimals) return null;

  const wholePart = wholePartRaw.replace(/^0+(?=\d)/, "") || "0";
  const fractionPadded = fractionPart.padEnd(decimals, "0");
  const combined = `${wholePart}${fractionPadded}`.replace(/^0+/, "");
  return combined.length > 0 ? combined : null;
}

export function uiAmountError(value: string, decimals: number): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Enter an amount.";
  if (!UI_AMOUNT_PATTERN.test(trimmed)) return "Enter a valid token amount.";

  const fractionPart = trimmed.split(".")[1] ?? "";
  if (fractionPart.length > decimals) {
    if (decimals === 0) {
      return "This token only supports whole-number amounts.";
    }
    return `Use at most ${decimals} decimal place${decimals === 1 ? "" : "s"}.`;
  }

  return uiAmountToBaseUnits(trimmed, decimals) ? null : "Amount must be greater than zero.";
}

export function shortenMint(mint: string): string {
  return `${mint.slice(0, 4)}...${mint.slice(-4)}`;
}

export function tokenFallbackLabel(token: Pick<SwapToken, "symbol" | "mint">): string {
  return token.symbol || shortenMint(token.mint);
}

export function tokenProgramLabel(token: Pick<SwapToken, "tokenProgram" | "isNative">): string {
  if (token.isNative || token.tokenProgram === "native") return "native";
  if (
    token.tokenProgram === "spl-token-2022" ||
    token.tokenProgram === TOKEN_2022_PROGRAM_ID
  ) {
    return "token-2022";
  }
  if (
    token.tokenProgram === "spl-token" ||
    token.tokenProgram === LEGACY_TOKEN_PROGRAM_ID
  ) {
    return "spl-token";
  }
  return "custom program";
}

function isSwapToken(value: unknown): value is SwapToken {
  if (!value || typeof value !== "object") return false;
  const token = value as Partial<SwapToken>;
  return (
    typeof token.mint === "string" &&
    typeof token.symbol === "string" &&
    typeof token.name === "string" &&
    typeof token.decimals === "number" &&
    typeof token.tokenProgram === "string" &&
    Array.isArray(token.tags)
  );
}

export function mergeUniqueTokens(...lists: SwapToken[][]): SwapToken[] {
  const deduped = new Map<string, SwapToken>();
  for (const list of lists) {
    for (const token of list) {
      if (!deduped.has(token.mint)) deduped.set(token.mint, token);
    }
  }
  return [...deduped.values()];
}

export function readRecentTokens(): SwapToken[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(RECENT_TOKENS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSwapToken).slice(0, MAX_RECENT_TOKENS);
  } catch {
    return [];
  }
}

export function writeRecentTokens(tokens: SwapToken[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      RECENT_TOKENS_STORAGE_KEY,
      JSON.stringify(tokens.slice(0, MAX_RECENT_TOKENS)),
    );
  } catch {
    // Ignore storage failures in private browsing or restricted environments.
  }
}

export function pushRecentToken(tokens: SwapToken[], token: SwapToken): SwapToken[] {
  return [token, ...tokens.filter((candidate) => candidate.mint !== token.mint)].slice(
    0,
    MAX_RECENT_TOKENS,
  );
}
