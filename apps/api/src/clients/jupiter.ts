import { request } from "undici";
import type { JupiterBuildResponse } from "@rawswap/tx-composer";
import { base58PublicKeySchema } from "@rawswap/shared";
import { z } from "zod";

const JUPITER = "https://api.jup.ag/swap/v2";
const JUPITER_TOKENS = "https://api.jup.ag/tokens/v2";
const UPSTREAM_TIMEOUT_MS = 30_000;

type JupiterApiErrorOptions = {
  requestUrl: string;
  upstreamStatus?: number | null;
  responseSnippet?: string | null;
  cause?: unknown;
};

const jupiterAccountSchema = z.object({
  pubkey: base58PublicKeySchema,
  isWritable: z.boolean(),
  isSigner: z.boolean(),
});

const jupiterInstructionSchema = z.object({
  programId: base58PublicKeySchema,
  accounts: z.array(jupiterAccountSchema),
  data: z.string(),
});

const routeStepSchema = z
  .object({
    swapInfo: z
      .object({
        label: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const jupiterQuoteResponseSchema = z
  .object({
    amount: z.union([z.string(), z.number()]).optional(),
    inAmount: z.union([z.string(), z.number()]).optional(),
    outAmount: z.union([z.string(), z.number()]).optional(),
    otherAmountThreshold: z.union([z.string(), z.number()]).optional(),
    priceImpactPct: z.union([z.string(), z.number()]).optional(),
    priceImpact: z.union([z.string(), z.number()]).optional(),
    routePlan: z.array(routeStepSchema).optional(),
  })
  .passthrough();

export const jupiterBuildResponseSchema = z
  .object({
    computeBudgetInstructions: z.array(jupiterInstructionSchema).optional(),
    setupInstructions: z.array(jupiterInstructionSchema).optional(),
    swapInstruction: jupiterInstructionSchema,
    cleanupInstruction: jupiterInstructionSchema.nullish(),
    otherInstructions: z.array(jupiterInstructionSchema).optional(),
    addressesByLookupTableAddress: z.record(z.array(base58PublicKeySchema)).optional(),
    blockhashWithMetadata: z
      .object({
        blockhash: z.string().min(1),
        lastValidBlockHeight: z.number().int().nonnegative().optional(),
      })
      .optional(),
    amount: z.union([z.string(), z.number()]).optional(),
    inAmount: z.union([z.string(), z.number()]).optional(),
    outAmount: z.union([z.string(), z.number()]).optional(),
    otherAmountThreshold: z.union([z.string(), z.number()]).optional(),
    priceImpactPct: z.union([z.string(), z.number()]).optional(),
    priceImpact: z.union([z.string(), z.number()]).optional(),
    routePlan: z.array(routeStepSchema).optional(),
  })
  .passthrough();

export const jupiterTokenSchema = z
  .object({
    id: base58PublicKeySchema,
    name: z.string(),
    symbol: z.string(),
    icon: z.string().url().nullable().optional(),
    decimals: z.number().int().nonnegative(),
    tokenProgram: z.string().min(1).optional(),
    organicScore: z.number().nullable().optional(),
    isVerified: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  })
  .passthrough();

export const jupiterTokenSearchResponseSchema = z.array(jupiterTokenSchema);

export type JupiterQuoteParams = {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps: number;
  /** Quote-only: omit for Jupiter quote-without-instructions mode if supported */
  taker?: string;
  apiKey: string;
};

export class JupiterApiError extends Error {
  public readonly requestUrl: string;
  public readonly upstreamStatus: number | null;
  public readonly responseSnippet: string | null;

  constructor(message: string, options: JupiterApiErrorOptions) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = "JupiterApiError";
    this.requestUrl = options.requestUrl;
    this.upstreamStatus = options.upstreamStatus ?? null;
    this.responseSnippet = options.responseSnippet ?? null;
  }
}

async function requestJupiterJson(url: string, apiKey: string, action: string): Promise<unknown> {
  let res;
  try {
    res = await request(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        ...(apiKey ? { "x-api-key": apiKey } : {}),
      },
      headersTimeout: UPSTREAM_TIMEOUT_MS,
      bodyTimeout: UPSTREAM_TIMEOUT_MS,
    });
  } catch (error) {
    throw new JupiterApiError(`Jupiter ${action} request failed.`, {
      requestUrl: url,
      cause: error,
    });
  }

  const bodyRaw = await res.body.text();
  if (res.statusCode >= 400) {
    throw new JupiterApiError(`Jupiter ${action} failed with HTTP ${res.statusCode}.`, {
      requestUrl: url,
      upstreamStatus: res.statusCode,
      responseSnippet: bodyRaw.slice(0, 500),
    });
  }

  try {
    return JSON.parse(bodyRaw) as unknown;
  } catch (error) {
    throw new JupiterApiError(`Jupiter ${action} returned invalid JSON.`, {
      requestUrl: url,
      upstreamStatus: res.statusCode,
      responseSnippet: bodyRaw.slice(0, 500),
      cause: error,
    });
  }
}

async function jupiterGetBuild(
  params: URLSearchParams,
  apiKey: string,
): Promise<JupiterBuildResponse & Record<string, unknown>> {
  const url = `${JUPITER}/build?${params.toString()}`;
  return (await requestJupiterJson(url, apiKey, "build")) as JupiterBuildResponse &
    Record<string, unknown>;
}

/** Quote path: same /build call; pass taker so Jupiter returns full shape (MVP). */
export async function getQuote(p: JupiterQuoteParams) {
  const params = new URLSearchParams({
    inputMint: p.inputMint,
    outputMint: p.outputMint,
    amount: p.amount,
    slippageBps: String(p.slippageBps),
  });
  if (p.taker) params.set("taker", p.taker);
  return jupiterGetBuild(params, p.apiKey);
}

export async function getBuildInstructions(p: JupiterQuoteParams & { taker: string }) {
  const params = new URLSearchParams({
    inputMint: p.inputMint,
    outputMint: p.outputMint,
    amount: p.amount,
    slippageBps: String(p.slippageBps),
    taker: p.taker,
  });
  return jupiterGetBuild(params, p.apiKey);
}

export async function searchTokens(query: string, apiKey: string) {
  const url = `${JUPITER_TOKENS}/search?${new URLSearchParams({ query }).toString()}`;
  return requestJupiterJson(url, apiKey, "token search");
}

export type { JupiterBuildResponse };
