import path from "node:path";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  unpackMint,
  getExtensionTypes,
} from "@solana/spl-token";
import {
  RawSwapError,
  SOL_MINT,
  TOKEN_PROGRAM_ID as LEGACY_TOKEN_PROGRAM_ID,
  type SwapToken,
  type TokenConfig,
} from "@rawswap/shared";
import {
  jupiterTokenSchema,
  jupiterTokenSearchResponseSchema,
  searchTokens as searchJupiterTokens,
} from "../clients/jupiter.js";
import type { Env } from "../env.js";
import { loadJsonConfig } from "./config-loader.js";
import { REPO_ROOT } from "./repo-root.js";
import { blockedToken2022Extensions, token2022ExtensionNames } from "./token-risk.js";

type TokenFile = { tokens: TokenConfig[] };

type RiskPolicy = {
  allowlistOnly: boolean;
  blockedToken2022Extensions?: string[];
};

type StoredQuoteMeta = {
  quoteMs: number;
  inputToken: SwapToken;
  outputToken: SwapToken;
};

type StoredRouteJson = Record<string, unknown> & {
  _rawswapMeta?: StoredQuoteMeta;
};

const INTERNAL_META_KEY = "_rawswapMeta";
const BASE58_PUBLIC_KEY_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const TOKEN_2022_PROGRAM_ID_STRING = TOKEN_2022_PROGRAM_ID.toBase58();

let tokenConfigCache: TokenFile | null = null;
let riskPolicyCache: RiskPolicy | null = null;
const liveTokenCache = new Map<string, SwapToken>();
const rpcConnectionCache = new Map<string, Connection>();
type MintRiskAssessment = {
  tokenProgram: string;
  decimals: number | null;
  freezeAuthority: string | null;
  mintAuthority: string | null;
  token2022Extensions: string[];
  blockedExtensions: string[];
  riskFlags: string[];
};

const mintRiskCache = new Map<string, MintRiskAssessment>();
const HARD_BLOCK_TOKEN_RISK_FLAGS = new Set([
  "TRANSFER_TAX_DETECTED",
  "TRANSFER_HOOK_PRESENT",
  "PERMANENT_DELEGATE_PRESENT",
  "MEMO_REQUIRED",
  "UNSUPPORTED_TOKEN_2022_EXTENSION",
]);

function getTokenFile(): TokenFile {
  if (!tokenConfigCache) {
    tokenConfigCache = loadJsonConfig<TokenFile>(
      path.join(REPO_ROOT, "config", "tokens.mainnet.json"),
    );
  }
  return tokenConfigCache;
}

function getRiskPolicy(): RiskPolicy {
  if (!riskPolicyCache) {
    riskPolicyCache = loadJsonConfig<RiskPolicy>(
      path.join(REPO_ROOT, "config", "risk-policy.json"),
    );
  }
  return riskPolicyCache;
}

function isTruthyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function fallbackSymbol(mint: string): string {
  return `${mint.slice(0, 4)}...${mint.slice(-4)}`;
}

function looksLikeMintAddress(value: string): boolean {
  return BASE58_PUBLIC_KEY_PATTERN.test(value);
}

function normalizeConfiguredToken(token: TokenConfig): SwapToken {
  return {
    mint: token.mint,
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    icon: null,
    isNative: token.isNative,
    isVerified: true,
    tokenProgram: token.tokenProgram,
    organicScore: null,
    tags: ["allowlisted"],
  };
}

function getConfiguredTokenMap(): Map<string, SwapToken> {
  return new Map(
    getTokenFile().tokens.map((token) => {
      const normalized = normalizeConfiguredToken(token);
      return [normalized.mint, normalized];
    }),
  );
}

function normalizeLiveToken(raw: unknown): SwapToken | null {
  const parsed = jupiterTokenSchema.safeParse(raw);
  if (!parsed.success) return null;

  const token = parsed.data;
  const tags = Array.isArray(token.tags)
    ? token.tags.filter((tag): tag is string => typeof tag === "string")
    : [];
  return {
    mint: token.id,
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    icon: token.icon ?? null,
    isNative: token.id === SOL_MINT,
    isVerified: token.isVerified ?? tags.includes("verified"),
    tokenProgram: token.tokenProgram ?? LEGACY_TOKEN_PROGRAM_ID,
    organicScore: token.organicScore ?? null,
    tags,
  };
}

function mergeTokenMetadata(configured: SwapToken | null, live: SwapToken | null): SwapToken | null {
  if (!configured && !live) return null;
  if (!configured) return live;
  if (!live) return configured;

  return {
    mint: configured.mint,
    symbol: configured.symbol || live.symbol,
    name: configured.name || live.name,
    decimals: configured.decimals,
    icon: live.icon,
    isNative: configured.isNative || live.isNative,
    isVerified: configured.isVerified || live.isVerified,
    tokenProgram: configured.tokenProgram || live.tokenProgram,
    organicScore: live.organicScore,
    tags: [...new Set([...configured.tags, ...live.tags])],
  };
}

function searchConfiguredTokens(query: string): SwapToken[] {
  const needle = query.trim().toLowerCase();
  const configured = [...getConfiguredTokenMap().values()];
  if (!needle) return configured;
  return configured.filter((token) =>
    [token.symbol, token.name, token.mint].some((value) => value.toLowerCase().includes(needle)),
  );
}

function cacheToken(token: SwapToken | null): SwapToken | null {
  if (token) liveTokenCache.set(token.mint, token);
  return token;
}

function getRpcConnection(env: Env): Connection {
  const cached = rpcConnectionCache.get(env.SOLANA_RPC_URL);
  if (cached) return cached;

  const connection = new Connection(env.SOLANA_RPC_URL, "confirmed");
  rpcConnectionCache.set(env.SOLANA_RPC_URL, connection);
  return connection;
}

async function fetchOnChainMintToken(mint: string, env: Env): Promise<SwapToken | null> {
  if (!looksLikeMintAddress(mint)) return null;

  try {
    const response = await getRpcConnection(env).getParsedAccountInfo(new PublicKey(mint), "confirmed");
    const account = response.value;
    if (!account || !account.data || typeof account.data !== "object" || !("parsed" in account.data)) {
      return null;
    }

    const parsed = account.data.parsed;
    if (!parsed || typeof parsed !== "object") return null;
    const parsedRecord = parsed as Record<string, unknown>;
    if (parsedRecord.type !== "mint") return null;

    const info = parsedRecord.info;
    if (!info || typeof info !== "object") return null;
    const decimals = (info as Record<string, unknown>).decimals;
    if (!Number.isInteger(decimals) || (decimals as number) < 0) {
      return null;
    }

    return {
      mint,
      symbol: fallbackSymbol(mint),
      name: fallbackSymbol(mint),
      decimals: decimals as number,
      icon: null,
      isNative: false,
      isVerified: false,
      tokenProgram: account.owner.toBase58(),
      organicScore: null,
      tags: ["onchain-fallback"],
    };
  } catch {
    return null;
  }
}

async function inspectMintRisk(
  mint: string,
  env: Env,
): Promise<MintRiskAssessment | null> {
  const cached = mintRiskCache.get(mint);
  if (cached) return cached;
  if (!looksLikeMintAddress(mint)) return null;

  try {
    const publicKey = new PublicKey(mint);
    const parsedInfo = await getRpcConnection(env).getParsedAccountInfo(publicKey, "confirmed");
    const parsedAccount = parsedInfo.value;
    let decimals: number | null = null;
    let freezeAuthority: string | null = null;
    let mintAuthority: string | null = null;
    if (
      parsedAccount &&
      parsedAccount.data &&
      typeof parsedAccount.data === "object" &&
      "parsed" in parsedAccount.data
    ) {
      const parsed = parsedAccount.data.parsed;
      if (parsed && typeof parsed === "object") {
        const parsedRecord = parsed as Record<string, unknown>;
        const info = parsedRecord.info;
        if (info && typeof info === "object") {
          const infoRecord = info as Record<string, unknown>;
          decimals = Number.isInteger(infoRecord.decimals) ? (infoRecord.decimals as number) : null;
          freezeAuthority =
            typeof infoRecord.freezeAuthority === "string" ? infoRecord.freezeAuthority : null;
          mintAuthority =
            typeof infoRecord.mintAuthority === "string" ? infoRecord.mintAuthority : null;
        }
      }
    }

    const account = await getRpcConnection(env).getAccountInfo(publicKey, "confirmed");
    if (!account) return null;

    const tokenProgram = account.owner.toBase58();
    const riskFlags = new Set<string>();
    if (freezeAuthority) riskFlags.add("FREEZE_AUTHORITY_PRESENT");
    if (mintAuthority) riskFlags.add("MINT_AUTHORITY_PRESENT");
    if (tokenProgram !== TOKEN_2022_PROGRAM_ID_STRING) {
      const risk = {
        tokenProgram,
        decimals,
        freezeAuthority,
        mintAuthority,
        token2022Extensions: [],
        blockedExtensions: [],
        riskFlags: [...riskFlags],
      };
      mintRiskCache.set(mint, risk);
      return risk;
    }

    const unpackedMint = unpackMint(publicKey, account, TOKEN_2022_PROGRAM_ID);
    const extensionTypes = getExtensionTypes(unpackedMint.tlvData) as ExtensionType[];
    const token2022Extensions = token2022ExtensionNames(extensionTypes);
    const blockedExtensions = blockedToken2022Extensions(
      extensionTypes,
      getRiskPolicy().blockedToken2022Extensions ?? [],
    );
    for (const extension of token2022Extensions) {
      if (extension === "transferFee") riskFlags.add("TRANSFER_TAX_DETECTED");
      if (extension === "transferHook") riskFlags.add("TRANSFER_HOOK_PRESENT");
      if (extension === "permanentDelegate") riskFlags.add("PERMANENT_DELEGATE_PRESENT");
      if (extension === "memoTransfer") riskFlags.add("MEMO_REQUIRED");
    }
    if (blockedExtensions.length > 0) {
      riskFlags.add("UNSUPPORTED_TOKEN_2022_EXTENSION");
    }
    const risk = {
      tokenProgram,
      decimals,
      freezeAuthority,
      mintAuthority,
      token2022Extensions,
      blockedExtensions,
      riskFlags: [...riskFlags],
    };
    mintRiskCache.set(mint, risk);
    return risk;
  } catch {
    return null;
  }
}

async function finalizeSupportedToken(token: SwapToken | null, env: Env): Promise<SwapToken | null> {
  if (!token || token.isNative) return token;

  const risk = await inspectMintRisk(token.mint, env);
  if (!risk) return token;
  if (risk.riskFlags.some((flag) => HARD_BLOCK_TOKEN_RISK_FLAGS.has(flag))) {
    throw new RawSwapError("TOKEN_RISK_BLOCKED", {
      message: "Token risk checks blocked this mint.",
      details: {
        mint: token.mint,
        tokenProgram: risk.tokenProgram,
        freezeAuthority: risk.freezeAuthority,
        mintAuthority: risk.mintAuthority,
        token2022Extensions: risk.token2022Extensions,
        blockedExtensions: risk.blockedExtensions,
        riskFlags: risk.riskFlags,
      },
      retryable: false,
    });
  }

  const normalized =
    risk.tokenProgram !== token.tokenProgram ? { ...token, tokenProgram: risk.tokenProgram } : token;
  liveTokenCache.set(normalized.mint, normalized);
  return normalized;
}

function sortTokens(tokens: SwapToken[], query: string): SwapToken[] {
  const needle = query.trim().toLowerCase();
  return tokens.sort((left, right) => {
    const leftExact =
      left.mint.toLowerCase() === needle || left.symbol.toLowerCase() === needle ? 1 : 0;
    const rightExact =
      right.mint.toLowerCase() === needle || right.symbol.toLowerCase() === needle ? 1 : 0;
    if (leftExact !== rightExact) return rightExact - leftExact;
    if (left.isVerified !== right.isVerified) return Number(right.isVerified) - Number(left.isVerified);
    return (right.organicScore ?? -1) - (left.organicScore ?? -1);
  });
}

async function searchLiveTokens(query: string, env: Env): Promise<SwapToken[]> {
  const raw = await searchJupiterTokens(query, env.JUPITER_API_KEY ?? "");
  const parsed = jupiterTokenSearchResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new RawSwapError("QUOTE_FAILED", {
      message: "Token provider returned invalid metadata.",
      details: { issues: parsed.error.flatten() },
    });
  }
  return parsed.data
    .map((token) => normalizeLiveToken(token))
    .filter((token): token is SwapToken => token !== null)
    .map((token) => cacheToken(mergeTokenMetadata(getConfiguredTokenMap().get(token.mint) ?? null, token)))
    .filter((token): token is SwapToken => token !== null);
}

export function formatUiAmount(baseAmount: string, decimals: number): string {
  if (decimals <= 0) return baseAmount;

  const units = BigInt(baseAmount);
  const scale = BigInt(`1${"0".repeat(decimals)}`);
  const whole = units / scale;
  const fraction = units % scale;
  const trimmedFraction = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${whole}.${trimmedFraction || "0"}`;
}

export function attachStoredQuoteMeta(
  providerQuote: Record<string, unknown>,
  meta: StoredQuoteMeta,
): Record<string, unknown> {
  return {
    ...providerQuote,
    [INTERNAL_META_KEY]: meta,
  };
}

export function readStoredQuoteMeta(routeJson: unknown): StoredQuoteMeta | null {
  if (!routeJson || typeof routeJson !== "object") return null;
  const meta = (routeJson as StoredRouteJson)._rawswapMeta;
  if (!meta) return null;
  if (!meta.inputToken || !meta.outputToken) return null;
  return meta;
}

export async function getSupportedTokenByMint(
  mint: string,
  env: Env,
): Promise<SwapToken | null> {
  const configured = getConfiguredTokenMap().get(mint) ?? null;
  if (configured) return await finalizeSupportedToken(configured, env);

  const risk = getRiskPolicy();
  if (risk.allowlistOnly) return null;

  const cached = liveTokenCache.get(mint);
  if (cached) return await finalizeSupportedToken(cached, env);

  try {
    const liveTokens = await searchLiveTokens(mint, env);
    const exact = liveTokens.find((token) => token.mint === mint) ?? null;
    if (exact) return await finalizeSupportedToken(exact, env);
  } catch {
    // Fall through to on-chain mint metadata when token search is degraded.
  }

  return await finalizeSupportedToken(cacheToken(await fetchOnChainMintToken(mint, env)), env);
}

export async function resolveSwapTokens(
  inputMint: string,
  outputMint: string,
  env: Env,
): Promise<{ inputToken: SwapToken; outputToken: SwapToken }> {
  if (inputMint === outputMint) {
    throw new RawSwapError("INVALID_REQUEST", {
      message: "Input and output mints must be different.",
    });
  }

  const [inputToken, outputToken] = await Promise.all([
    getSupportedTokenByMint(inputMint, env),
    getSupportedTokenByMint(outputMint, env),
  ]);

  if (!inputToken || !outputToken) {
    throw new RawSwapError("UNSUPPORTED_PAIR");
  }

  return { inputToken, outputToken };
}

export async function searchSupportedTokens(
  query: string,
  env: Env,
  limit = 20,
): Promise<SwapToken[]> {
  const trimmed = query.trim();
  const configuredMatches = searchConfiguredTokens(trimmed);
  const risk = getRiskPolicy();

  if (!trimmed || risk.allowlistOnly) {
    const safeConfigured: SwapToken[] = [];
    for (const token of configuredMatches) {
      try {
        const finalized = await finalizeSupportedToken(token, env);
        if (finalized) safeConfigured.push(finalized);
      } catch (error) {
        if (!(error instanceof RawSwapError) || error.shape.code !== "TOKEN_RISK_BLOCKED") {
          throw error;
        }
      }
      if (safeConfigured.length >= limit) break;
    }
    return safeConfigured;
  }

  const mergedByMint = new Map<string, SwapToken>();
  for (const token of configuredMatches) {
    mergedByMint.set(token.mint, token);
  }

  try {
    const liveMatches = await searchLiveTokens(trimmed, env);
    for (const token of liveMatches) {
      mergedByMint.set(token.mint, token);
    }
  } catch {
    // Fall through to on-chain exact mint fallback below.
  }

  if (looksLikeMintAddress(trimmed) && !mergedByMint.has(trimmed)) {
    const exactMintToken = await getSupportedTokenByMint(trimmed, env);
    if (exactMintToken) {
      mergedByMint.set(exactMintToken.mint, exactMintToken);
    }
  }

  const sorted = sortTokens([...mergedByMint.values()], trimmed);
  const safeTokens: SwapToken[] = [];
  for (const token of sorted) {
    try {
      const finalized = await finalizeSupportedToken(token, env);
      if (finalized) safeTokens.push(finalized);
    } catch (error) {
      if (!(error instanceof RawSwapError) || error.shape.code !== "TOKEN_RISK_BLOCKED") {
        throw error;
      }
    }
    if (safeTokens.length >= limit) break;
  }

  return safeTokens;
}

export function quoteMsFromRouteJson(routeJson: unknown): number | null {
  if (!routeJson || typeof routeJson !== "object") return null;
  const value = (routeJson as Record<string, unknown>)._rawswapMeta;
  if (!value || typeof value !== "object") return null;
  const quoteMs = (value as Record<string, unknown>).quoteMs;
  return typeof quoteMs === "number" ? quoteMs : null;
}

export function defaultBaseAmount(decimals: number): string {
  if (decimals <= 0) return "1";
  return `1${"0".repeat(decimals)}`;
}

export function tokenLabel(token: SwapToken): string {
  if (isTruthyString(token.symbol)) return token.symbol;
  return fallbackSymbol(token.mint);
}
