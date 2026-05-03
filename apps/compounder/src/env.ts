import { Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "node:fs";
import { z } from "zod";

import { compounderLogJson } from "./log.js";

const solanaPubkey = z
  .string()
  .trim()
  .refine((s) => {
    try {
      // eslint-disable-next-line no-new -- PublicKey parses base58 only; ctor throws on invalid input
      new PublicKey(s);
      return true;
    } catch {
      return false;
    }
  }, "must be a valid Solana base58 public key");

const optionalPubkeyEnv = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  solanaPubkey.optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  REDIS_URL: z.string().min(1),
  SOLANA_RPC_URL: z.string().url(),
  PROTOCOL_FEE_VAULT: solanaPubkey,
  RAWSWAP_MINT: optionalPubkeyEnv,
  /** Path to the compounder's signing keypair JSON file (64-byte secret key array). */
  COMPOUNDER_KEYPAIR_PATH: z.string().min(1).optional(),
  /** Minimum fee vault balance (in lamports) before triggering a buyback. Default: 1 SOL. */
  BUYBACK_THRESHOLD_LAMPORTS: z.coerce.number().int().min(0).default(1_000_000_000),
  /** Jupiter API key for SOL→RAWSWAP quotes/swaps. */
  JUPITER_API_KEY: z.string().optional().default(""),
  /** Orca pool address for permanent LP deposits. */
  ORCA_RAWSWAP_SOL_POOL: optionalPubkeyEnv,
  /** Raydium pool address for permanent LP deposits. */
  RAYDIUM_RAWSWAP_SOL_POOL: optionalPubkeyEnv,
});

export type CompounderEnv = z.infer<typeof envSchema> & {
  /** Loaded compounder signing keypair (null if path not provided — read-only mode). */
  compounderKeypair: Keypair | null;
  /** Parsed fee vault public key. */
  feeVaultPubkey: PublicKey;
};

function loadKeypairFromPath(path: string): Keypair {
  if (!fs.existsSync(path)) {
    throw new Error(`Compounder keypair file not found: ${path}`);
  }
  const raw = fs.readFileSync(path, "utf-8");
  let bytes: number[];
  try {
    bytes = JSON.parse(raw) as number[];
  } catch {
    throw new Error(`Compounder keypair file is not valid JSON: ${path}`);
  }
  if (!Array.isArray(bytes) || bytes.length !== 64) {
    throw new Error(`Compounder keypair must be a 64-byte array, got ${bytes.length} bytes`);
  }
  return Keypair.fromSecretKey(Uint8Array.from(bytes));
}

export function loadCompounderEnv(): CompounderEnv {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join(".") || "env"}: ${i.message}`)
      .join("; ");
    compounderLogJson("error", "compounder env validation failed", { detail });
    throw new Error(`Invalid compounder environment: ${detail}`);
  }

  const data = parsed.data;

  // Load signing keypair if path provided
  let compounderKeypair: Keypair | null = null;
  if (data.COMPOUNDER_KEYPAIR_PATH) {
    compounderKeypair = loadKeypairFromPath(data.COMPOUNDER_KEYPAIR_PATH);
    compounderLogJson("info", "compounder keypair loaded", {
      pubkey: compounderKeypair.publicKey.toBase58(),
    });
  } else {
    compounderLogJson("warn", "COMPOUNDER_KEYPAIR_PATH not set — running in read-only mode (no buybacks)");
  }

  const feeVaultPubkey = new PublicKey(data.PROTOCOL_FEE_VAULT);

  return {
    ...data,
    compounderKeypair,
    feeVaultPubkey,
  };
}
