import { z } from "zod";
import { amountSchema, base58PublicKeySchema, mintSchema, slippageBpsSchema } from "./common.js";

const tokenSummarySchema = z.object({
  mint: mintSchema,
  symbol: z.string(),
  name: z.string(),
  decimals: z.number().int().nonnegative(),
  icon: z.string().url().nullable(),
  isNative: z.boolean(),
  isVerified: z.boolean(),
  tokenProgram: z.string(),
  organicScore: z.number().nullable(),
  tags: z.array(z.string()),
});

export const quoteRequestSchema = z.object({
  inputMint: mintSchema,
  outputMint: mintSchema,
  amount: amountSchema,
  slippageBps: slippageBpsSchema,
  userPublicKey: base58PublicKeySchema,
});

export const quoteResponseSchema = z.object({
  quoteId: z.string().uuid(),
  inputMint: mintSchema,
  outputMint: mintSchema,
  inAmount: z.string(),
  outAmount: z.string(),
  minimumOutAmount: z.string(),
  priceImpactPct: z.string(),
  expiresAt: z.string(),
  routeSummary: z.object({
    venues: z.array(z.string()),
    hops: z.number().int().nonnegative(),
  }),
  inputToken: tokenSummarySchema,
  outputToken: tokenSummarySchema,
  inAmountUi: z.string(),
  outAmountUi: z.string(),
  minimumOutAmountUi: z.string(),
});
