import { z } from "zod";
import { base58PublicKeySchema, mintSchema } from "./common.js";

const urgency = z.enum(["low", "normal", "high", "launch"]);
const executionMode = z.enum(["jito_single_tx", "fallback_rpc", "jito_bundle_only"]);

export const buildRequestSchema = z.object({
  quoteId: z.string().uuid(),
  userPublicKey: base58PublicKeySchema,
  urgency,
  executionMode,
});

export const userReviewSchema = z.object({
  inputMint: mintSchema,
  outputMint: mintSchema,
  inputSymbol: z.string().min(1),
  outputSymbol: z.string().min(1),
  inputDecimals: z.number().int().nonnegative(),
  outputDecimals: z.number().int().nonnegative(),
  inputAmountUi: z.string().min(1),
  expectedOutputUi: z.string().min(1),
  minimumOutputUi: z.string().min(1),
  maxNetworkCostLamports: z.number().int().nonnegative(),
  /** True when API env has fee vaults and the swap spends wSOL (SOL path). */
  protocolFeeApplied: z.boolean(),
  estimatedProtocolBuybackFeeLamports: z.number().int().nonnegative().optional(),
  estimatedProtocolTreasuryFeeLamports: z.number().int().nonnegative().optional(),
  estimatedProtocolFeeTotalLamports: z.number().int().nonnegative().optional(),
});

export const buildResponseSchema = z.object({
  buildId: z.string().uuid(),
  unsignedTransactionBase64: z.string().min(1),
  transactionMessageHash: z.string().min(1),
  recentBlockhash: z.string().min(1),
  lastValidBlockHeight: z.number().int().nonnegative().nullable(),
  estimatedPriorityFeeLamports: z.number().int().nonnegative(),
  computeUnitPriceMicroLamports: z.number().int().nonnegative(),
  estimatedJitoTipLamports: z.number().int().nonnegative(),
  expiresAt: z.string().min(1),
  routeSummary: z.object({
    venues: z.array(z.string()),
    hops: z.number().int().nonnegative(),
  }),
  userReview: userReviewSchema,
});
