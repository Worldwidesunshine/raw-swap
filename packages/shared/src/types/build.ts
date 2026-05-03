import type { z } from "zod";
import type { buildRequestSchema, buildResponseSchema } from "../schemas/build.js";

export type BuildRequest = z.infer<typeof buildRequestSchema>;
export type UrgencyProfileName = BuildRequest["urgency"];
export type BuildResponse = z.infer<typeof buildResponseSchema>;

export type UserReview = BuildResponse["userReview"];

export type BuildRecord = {
  id: string;
  quoteId: string;
  userPublicKey: string;
  unsignedTransactionBase64: string;
  transactionMessageHash: string;
  recentBlockhash: string;
  lastValidBlockHeight: number | null;
  urgency: string;
  executionMode: string;
  estimatedPriorityFeeLamports: number | null;
  estimatedJitoTipLamports: number | null;
  expectedSigners: unknown;
  instructionProgramIds: unknown;
  lookupTableAccounts: unknown;
  buildMetadata: unknown;
  createdAt: Date;
  expiresAt: Date;
};
