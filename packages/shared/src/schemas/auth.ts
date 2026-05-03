import { z } from "zod";
import { base58PublicKeySchema } from "./common.js";

export const walletSessionRequestSchema = z.object({
  walletPublicKey: base58PublicKeySchema,
  issuedAt: z.number().int().positive(),
  signatureBase64: z.string().min(1),
});

export const walletSessionResponseSchema = z.object({
  walletPublicKey: base58PublicKeySchema,
  walletSessionToken: z.string().min(32),
  expiresAt: z.string().min(1),
});
