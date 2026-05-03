import { z } from "zod";

export const liquidityPoolVenueSchema = z.enum(["orca_whirlpool", "raydium_cpmm"]);

export const liquidityPoolEntrySchema = z.object({
  venue: liquidityPoolVenueSchema,
  address: z.string().min(32).max(44),
  label: z.string().optional(),
});

export const liquidityPoolsResponseSchema = z.object({
  pools: z.array(liquidityPoolEntrySchema),
});

export const liquidityDepositRequestSchema = z.object({
  poolAddress: z.string().min(32).max(44),
  venue: liquidityPoolVenueSchema,
  /** Optional UI amount until deposit ix wiring is complete */
  amount: z.string().optional(),
  /**
   * Fee payer / signer (base58). Required only when `LP_DEV_STUB_LIQUIDITY_TX` is enabled on the API
   * for a dev-only unsigned tx smoke test; ignored for previews.
   */
  userPublicKey: z.string().min(32).max(44).optional(),
});

export const liquidityWithdrawRequestSchema = liquidityDepositRequestSchema;

export const liquidityPreviewResponseSchema = z.object({
  poolAddress: z.string().min(32).max(44),
  venue: liquidityPoolVenueSchema,
  /** No unsigned tx until Orca/Raydium ix builders are wired */
  unsignedTransactionBase64: z.null(),
  sdkNextStep: z.string().min(1),
});
