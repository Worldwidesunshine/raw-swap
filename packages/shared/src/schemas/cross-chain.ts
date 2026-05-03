import { z } from "zod";

/** Valid cross-chain transfer statuses. */
export const crossChainTransferStatusEnum = z.enum([
  "created",
  "pending",
  "fulfilled",
  "failed",
  "cancelled",
]);

export type CrossChainTransferStatus = z.infer<typeof crossChainTransferStatusEnum>;

export const crossChainTransferCreateSchema = z.object({
  provider: z.string().min(1).max(64),
  orderId: z.string().min(1).max(256).optional(),
  sourceChain: z.string().min(1).max(64),
  destChain: z.string().min(1).max(64),
  status: crossChainTransferStatusEnum,
  amountIn: z.string().optional(),
  amountOut: z.string().optional(),
  mintIn: z.string().max(64).optional(),
  mintOut: z.string().max(64).optional(),
  walletPublicKey: z.string().min(32).max(44).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const crossChainTransferRecordSchema = z.object({
  id: z.string().uuid(),
  provider: z.string(),
  orderId: z.string().nullable(),
  sourceChain: z.string(),
  destChain: z.string(),
  status: z.string(),
  amountIn: z.string().nullable(),
  amountOut: z.string().nullable(),
  mintIn: z.string().nullable(),
  mintOut: z.string().nullable(),
  walletPublicKey: z.string().nullable(),
  metadata: z.unknown().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const crossChainTransferListResponseSchema = z.object({
  transfers: z.array(crossChainTransferRecordSchema),
});

export const crossChainTransferPatchSchema = z.object({
  status: crossChainTransferStatusEnum,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

