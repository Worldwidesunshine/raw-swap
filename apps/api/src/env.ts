import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url().or(z.string().startsWith("postgresql://")),
  REDIS_URL: z.string().min(1),
  SOLANA_RPC_URL: z.string().url(),
  JUPITER_API_KEY: z.string().optional().default(""),
  JITO_BLOCK_ENGINE_URL: z.string().url().default("https://mainnet.block-engine.jito.wtf"),
  JITO_REGION: z.string().optional(),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  EXECUTION_ACCESS_TOKEN_SECRET: z.string().min(16).optional(),
  INTERNAL_API_ACCESS_TOKEN: z.string().min(16).optional(),
  PROTOCOL_FEE_VAULT: z.string().min(32).max(44).optional(),
  TREASURY_WALLET: z.string().min(32).max(44).optional(),
  ORCA_RAWSWAP_SOL_POOL: z.string().min(32).max(44).optional(),
  RAYDIUM_RAWSWAP_SOL_POOL: z.string().min(32).max(44).optional(),
  /** Set to `1` or `true` to return a dev-only unsigned tx from POST liquidity deposit/withdraw when `userPublicKey` is sent */
  LP_DEV_STUB_LIQUIDITY_TX: z.string().optional().default(""),
  RAWSWAP_MINT: z.string().min(32).max(44).optional(),
  DEBRIDGE_AFFILIATE_RECIPIENT: z.string().optional(),
  DEBRIDGE_AFFILIATE_FEE_PERCENT: z.coerce.number().min(0).max(10).optional(),
  ENABLE_API_DOCS: z.string().optional().default(""),
  TRUST_PROXY: z.string().optional().default(""),
  DEBRIDGE_PROXY_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(60_000).default(10_000),
});

export type BaseEnv = z.infer<typeof envSchema>;

export type Env = BaseEnv & {
  /** Regional override when `JITO_REGION` is set; otherwise `JITO_BLOCK_ENGINE_URL`. */
  effectiveJitoBlockEngineUrl: string;
  executionAccessTokenSecret: string;
  internalApiAccessToken: string;
  corsOrigins: string[];
  /** True when `LP_DEV_STUB_LIQUIDITY_TX` is `1` or `true` */
  lpDevStubLiquidityTx: boolean;
  enableApiDocs: boolean;
  trustProxy: boolean;
  debridgeProxyTimeoutMs: number;
};

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(parsed.error.flatten());
    throw new Error("Invalid environment configuration");
  }
  const data = parsed.data;
  const effectiveJitoBlockEngineUrl = data.JITO_REGION
    ? `https://${data.JITO_REGION}.mainnet.block-engine.jito.wtf`
    : data.JITO_BLOCK_ENGINE_URL;
  const isProductionLike = data.NODE_ENV === "production" || data.NODE_ENV === "staging";
  let executionAccessTokenSecret = data.EXECUTION_ACCESS_TOKEN_SECRET;
  if (!executionAccessTokenSecret) {
    if (isProductionLike) {
      throw new Error("EXECUTION_ACCESS_TOKEN_SECRET is required in production and staging");
    }
    executionAccessTokenSecret = "rawswap-dev-execution-access-token-secret-change-me";
  }
  let internalApiAccessToken = data.INTERNAL_API_ACCESS_TOKEN;
  if (!internalApiAccessToken) {
    if (isProductionLike) {
      throw new Error("INTERNAL_API_ACCESS_TOKEN is required in production and staging");
    }
    internalApiAccessToken = "rawswap-dev-internal-api-access-token-change-me";
  }
  const corsOrigins = data.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const lpDevStubLiquidityTx =
    data.LP_DEV_STUB_LIQUIDITY_TX === "1" ||
    data.LP_DEV_STUB_LIQUIDITY_TX.toLowerCase() === "true";
  const enableApiDocs =
    data.ENABLE_API_DOCS === "1" ||
    data.ENABLE_API_DOCS.toLowerCase() === "true" ||
    (!isProductionLike && data.ENABLE_API_DOCS.length === 0);
  const trustProxy =
    data.TRUST_PROXY === "1" ||
    data.TRUST_PROXY.toLowerCase() === "true";
  return {
    ...data,
    effectiveJitoBlockEngineUrl,
    executionAccessTokenSecret,
    internalApiAccessToken,
    corsOrigins,
    lpDevStubLiquidityTx,
    enableApiDocs,
    trustProxy,
    debridgeProxyTimeoutMs: data.DEBRIDGE_PROXY_TIMEOUT_MS,
  };
}
