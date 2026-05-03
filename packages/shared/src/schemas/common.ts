import { z } from "zod";

export const base58PublicKeySchema = z
  .string()
  .min(32)
  .max(44)
  .regex(/^[1-9A-HJ-NP-Za-km-z]+$/);

/** Mainnet-style SPL mints are base58 pubkeys (same constraints as wallets). */
export const mintSchema = base58PublicKeySchema;

export const amountSchema = z
  .string()
  .regex(/^[1-9][0-9]*$/, "Amount must be a positive integer string in base units");

/** Slippage tolerance in basis points (0 = exact out, 10000 = 100%). */
export const slippageBpsSchema = z.number().int().min(0).max(10000);
