import { z } from "zod";

const executionMode = z.enum(["jito_single_tx", "fallback_rpc", "jito_bundle_only"]);

export const submitRequestSchema = z.object({
  buildId: z.string().uuid(),
  signedTransactionBase64: z.string().min(1),
  executionMode,
  allowFallback: z.boolean(),
  idempotencyKey: z.string().uuid(),
});

export const submitResponseSchema = z.object({
  executionId: z.string().uuid(),
  signature: z.string().min(1),
  bundleId: z.string().nullable(),
  executionAccessToken: z.string().min(32),
  status: z.string().min(1),
  submittedVia: z.enum(["jito", "fallback_rpc"]),
  submittedAt: z.string().min(1),
});
