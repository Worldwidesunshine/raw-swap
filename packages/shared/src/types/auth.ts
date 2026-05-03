import type { z } from "zod";
import type {
  walletSessionRequestSchema,
  walletSessionResponseSchema,
} from "../schemas/auth.js";

export type WalletSessionRequest = z.infer<typeof walletSessionRequestSchema>;
export type WalletSessionResponse = z.infer<typeof walletSessionResponseSchema>;
