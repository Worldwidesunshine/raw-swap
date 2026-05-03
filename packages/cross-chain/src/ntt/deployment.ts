import { z } from "zod";

/** Minimal deployment manifest shape for Wormhole NTT (Wave 10–13). */
export const nttRateLimitSchema = z.object({
  chainId: z.number().int(),
  outboundLimit: z.string().optional(),
  inboundLimit: z.string().optional(),
});

export const nttDeploymentFileSchema = z.object({
  version: z.string().optional(),
  hub: z.enum(["solana"]).optional(),
  chains: z
    .array(
      z.object({
        chainId: z.number().int(),
        manager: z.string().optional(),
        token: z.string().optional(),
        mode: z.enum(["locking", "burning"]).optional(),
      }),
    )
    .optional(),
  rateLimits: z.array(nttRateLimitSchema).optional(),
});

export type NttDeploymentFile = z.infer<typeof nttDeploymentFileSchema>;
