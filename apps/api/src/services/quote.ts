import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import {
  RawSwapError,
  quoteRequestSchema,
  type QuoteResponse,
} from "@rawswap/shared";
import { getDb } from "../db/index.js";
import { quotes } from "../db/schema/quotes.js";
import { getQuote as jupiterGetQuote, jupiterQuoteResponseSchema } from "../clients/jupiter.js";
import type { Env } from "../env.js";
import { loadJsonConfig } from "../utils/config-loader.js";
import { REPO_ROOT } from "../utils/repo-root.js";
import { normalizeUpstreamError } from "../utils/upstream-errors.js";
import {
  attachStoredQuoteMeta,
  formatUiAmount,
  resolveSwapTokens,
} from "../utils/token-catalog.js";

let riskPolicyCache: { maxSlippageBps: number } | null = null;

function withQuoteTiming(
  data: Record<string, unknown>,
  quoteMs: number,
): Record<string, unknown> {
  return { ...data, _rawswapQuoteMs: quoteMs };
}

function getRiskPolicy(): { maxSlippageBps: number } {
  if (!riskPolicyCache) {
    riskPolicyCache = loadJsonConfig<{ maxSlippageBps: number }>(
      path.join(REPO_ROOT, "config", "risk-policy.json"),
    );
  }
  return riskPolicyCache;
}

function extractVenues(routePlan: unknown): string[] {
  if (!Array.isArray(routePlan)) return [];
  const venues = new Set<string>();
  for (const step of routePlan as { swapInfo?: { label?: string } }[]) {
    if (step.swapInfo?.label) venues.add(step.swapInfo.label);
  }
  return [...venues];
}

export async function createQuote(body: unknown, env: Env): Promise<QuoteResponse> {
  const parsed = quoteRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new RawSwapError("INVALID_REQUEST", {
      message: "Quote request body is invalid.",
      details: { issues: parsed.error.flatten() },
    });
  }

  const { inputMint, outputMint, amount, slippageBps, userPublicKey } = parsed.data;
  const { inputToken, outputToken } = await resolveSwapTokens(inputMint, outputMint, env);

  const risk = getRiskPolicy();
  if (slippageBps > risk.maxSlippageBps) throw new RawSwapError("INVALID_SLIPPAGE");

  const quoteStart = Date.now();
  let providerRaw;
  try {
    providerRaw = await jupiterGetQuote({
      inputMint,
      outputMint,
      amount,
      slippageBps,
      taker: userPublicKey,
      apiKey: env.JUPITER_API_KEY ?? "",
    });
  } catch (error) {
    throw normalizeUpstreamError(error, "QUOTE_FAILED", "Jupiter", "quote");
  }
  const quoteMs = Date.now() - quoteStart;
  const providerParsed = jupiterQuoteResponseSchema.safeParse(providerRaw);
  if (!providerParsed.success) {
    throw new RawSwapError("QUOTE_FAILED", {
      message: "Route provider returned an invalid quote payload.",
      details: { issues: providerParsed.error.flatten() },
    });
  }
  const data = providerParsed.data as Record<string, unknown>;

  const inAmount = String(data.inAmount ?? data.amount ?? amount);
  const outAmount = String(data.outAmount ?? "0");
  const minOut = String(data.otherAmountThreshold ?? data.outAmount ?? "0");
  const priceImpact = String(data.priceImpactPct ?? data.priceImpact ?? "0");
  const quoteId = uuidv4();
  const expiresAt = new Date(Date.now() + 60_000);
  const storedRouteJson = attachStoredQuoteMeta(withQuoteTiming(data, quoteMs), {
    quoteMs,
    inputToken,
    outputToken,
  });

  await getDb().insert(quotes).values({
    id: quoteId,
    userPublicKey,
    inputMint,
    outputMint,
    inputAmount: inAmount,
    expectedOutputAmount: outAmount,
    minimumOutputAmount: minOut,
    slippageBps,
    priceImpactPct: priceImpact,
    routeJson: storedRouteJson,
    provider: "jupiter",
    expiresAt,
  });

  return {
    quoteId,
    inputMint,
    outputMint,
    inAmount,
    outAmount,
    minimumOutAmount: minOut,
    priceImpactPct: priceImpact,
    expiresAt: expiresAt.toISOString(),
    routeSummary: {
      venues: extractVenues(data.routePlan),
      hops: Array.isArray(data.routePlan) ? data.routePlan.length : 0,
    },
    inputToken,
    outputToken,
    inAmountUi: formatUiAmount(inAmount, inputToken.decimals),
    outAmountUi: formatUiAmount(outAmount, outputToken.decimals),
    minimumOutAmountUi: formatUiAmount(minOut, outputToken.decimals),
  };
}

export async function getQuoteRecord(id: string) {
  const rows = await getDb().select().from(quotes).where(eq(quotes.id, id)).limit(1);
  return rows[0] ?? null;
}
