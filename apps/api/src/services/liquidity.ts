import { desc, eq } from "drizzle-orm";
import type { Env } from "../env.js";
import { getDb, liquidityPools, lpPositions } from "../db/index.js";
import type { LiquidityPoolEntry } from "@rawswap/shared";
import {
  RawSwapError,
  liquidityDepositRequestSchema,
  liquidityPoolsResponseSchema,
  liquidityPreviewResponseSchema,
  liquidityWithdrawRequestSchema,
} from "@rawswap/shared";
import { Connection } from "@solana/web3.js";
import {
  poolsFromEnv_entries,
  poolRowFromDbShape,
  buildLiquidityDevStubVersionedTransaction,
  describeOrcaDepositNote,
  describeOrcaWithdrawNote,
  describeRaydiumDepositNote,
  describeRaydiumWithdrawNote,
} from "@rawswap/lp-sdk";
import { SolanaRpcClient } from "../clients/solana-rpc.js";

function poolDedupeKey(p: Pick<LiquidityPoolEntry, "venue" | "address">): string {
  return `${p.venue}:${p.address}`;
}

function labelFromDbMetadata(metadata: unknown): string | undefined {
  if (
    metadata &&
    typeof metadata === "object" &&
    !Array.isArray(metadata) &&
    "label" in metadata &&
    typeof (metadata as { label?: unknown }).label === "string"
  ) {
    return (metadata as { label: string }).label;
  }
  return undefined;
}

function mapLiquidityPoolRow(r: typeof liquidityPools.$inferSelect): LiquidityPoolEntry | null {
  try {
    const base = poolRowFromDbShape({
      venue: r.venue,
      poolAddress: r.poolAddress,
      mintA: r.mintA,
      mintB: r.mintB,
      feeTierBps: r.feeTierBps,
    });
    const address = base.address.trim();
    if (address.length < 32 || address.length > 44) return null;
    const metaLabel = labelFromDbMetadata(r.metadata);
    return { ...base, label: metaLabel ?? base.label };
  } catch {
    return null;
  }
}

export async function listConfiguredPools(env: Env) {
  const dbRows = await getDb()
    .select()
    .from(liquidityPools)
    .orderBy(desc(liquidityPools.createdAt))
    .limit(50);

  const dbEntries = dbRows
    .map(mapLiquidityPoolRow)
    .filter((row): row is LiquidityPoolEntry => row !== null);

  const envPools = poolsFromEnv_entries({
    orca: env.ORCA_RAWSWAP_SOL_POOL,
    raydium: env.RAYDIUM_RAWSWAP_SOL_POOL,
  });

  const mergedByKey = new Map<string, LiquidityPoolEntry>();
  for (const p of envPools) {
    mergedByKey.set(poolDedupeKey(p), p);
  }
  for (const p of dbEntries) {
    mergedByKey.set(poolDedupeKey(p), p);
  }

  const ordered: LiquidityPoolEntry[] = [];
  const seen = new Set<string>();
  for (const entry of dbEntries) {
    const k = poolDedupeKey(entry);
    if (!seen.has(k)) {
      seen.add(k);
      ordered.push(mergedByKey.get(k)!);
    }
  }
  for (const entry of envPools) {
    const k = poolDedupeKey(entry);
    if (!seen.has(k)) {
      seen.add(k);
      ordered.push(mergedByKey.get(k)!);
    }
  }

  return liquidityPoolsResponseSchema.parse({ pools: ordered });
}

export type SerializedLpPosition = {
  id: string;
  walletPublicKey: string;
  venue: string;
  poolAddress: string;
  chain: string;
  positionMint: string | null;
  liquidityRaw: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listLpPositionsForWallet(wallet: string): Promise<{
  positions: SerializedLpPosition[];
}> {
  const rows = await getDb()
    .select()
    .from(lpPositions)
    .where(eq(lpPositions.walletPublicKey, wallet))
    .limit(100);
  const positions = rows.map((row) => ({
    id: row.id,
    walletPublicKey: row.walletPublicKey,
    venue: row.venue,
    poolAddress: row.poolAddress,
    chain: row.chain,
    positionMint: row.positionMint,
    liquidityRaw: row.liquidityRaw,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
  return { positions };
}

export function parseLiquidityDepositBody(body: unknown) {
  const parsed = liquidityDepositRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new RawSwapError("INVALID_REQUEST", {
      message: "Liquidity deposit body is invalid.",
      details: { issues: parsed.error.flatten() },
    });
  }
  return parsed.data;
}

export function parseLiquidityWithdrawBody(body: unknown) {
  const parsed = liquidityWithdrawRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new RawSwapError("INVALID_REQUEST", {
      message: "Liquidity withdraw body is invalid.",
      details: { issues: parsed.error.flatten() },
    });
  }
  return parsed.data;
}

function sdkNoteForDeposit(venue: "orca_whirlpool" | "raydium_cpmm", poolAddress: string): string {
  return venue === "orca_whirlpool"
    ? describeOrcaDepositNote(poolAddress)
    : describeRaydiumDepositNote(poolAddress);
}

function sdkNoteForWithdraw(venue: "orca_whirlpool" | "raydium_cpmm", poolAddress: string): string {
  return venue === "orca_whirlpool"
    ? describeOrcaWithdrawNote(poolAddress)
    : describeRaydiumWithdrawNote(poolAddress);
}

export function previewLiquidityDeposit(body: unknown) {
  const parsed = liquidityDepositRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new RawSwapError("INVALID_REQUEST", {
      message: "Liquidity deposit preview body is invalid.",
      details: { issues: parsed.error.flatten() },
    });
  }
  const { poolAddress, venue } = parsed.data;
  return liquidityPreviewResponseSchema.parse({
    poolAddress,
    venue,
    unsignedTransactionBase64: null,
    sdkNextStep: sdkNoteForDeposit(venue, poolAddress),
  });
}

export function previewLiquidityWithdraw(body: unknown) {
  const parsed = liquidityWithdrawRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new RawSwapError("INVALID_REQUEST", {
      message: "Liquidity withdraw preview body is invalid.",
      details: { issues: parsed.error.flatten() },
    });
  }
  const { poolAddress, venue } = parsed.data;
  return liquidityPreviewResponseSchema.parse({
    poolAddress,
    venue,
    unsignedTransactionBase64: null,
    sdkNextStep: sdkNoteForWithdraw(venue, poolAddress),
  });
}

type DepositParsed = ReturnType<typeof parseLiquidityDepositBody>;
type WithdrawParsed = ReturnType<typeof parseLiquidityWithdrawBody>;

/** Optional overrides (e.g. tests) for LP dev stub RPC. */
export type LiquidityStubDeps = {
  getLatestBlockhash?: () => Promise<{ blockhash: string; lastValidBlockHeight: number }>;
};

/** 501 JSON for POST /liquidity/deposit until Orca/Raydium ix builders exist. */
export function liquidityDepositNotImplementedBody(parsed: DepositParsed) {
  return {
    code: "LIQUIDITY_DEPOSIT_TODO" as const,
    status: "not_implemented" as const,
    message:
      "Unsigned Orca/Raydium deposit transaction is not wired yet. Use POST /api/liquidity/preview-deposit for the SDK integration note.",
    poolAddress: parsed.poolAddress,
    venue: parsed.venue,
    unsignedTransactionBase64: null,
    transactionMessageHashSha256Base64: null,
    sdkNextStep: sdkNoteForDeposit(parsed.venue, parsed.poolAddress),
    documentation:
      "When implemented, this endpoint should mirror POST /api/build (unsigned base64 + message hash for the signer). Dev-only stub: set env LP_DEV_STUB_LIQUIDITY_TX=1 and include userPublicKey in the body to receive a serializeable placeholder transaction.",
  };
}

/** 501 JSON for POST /liquidity/withdraw until Orca/Raydium ix builders exist. */
export function liquidityWithdrawNotImplementedBody(parsed: WithdrawParsed) {
  return {
    code: "LIQUIDITY_WITHDRAW_TODO" as const,
    status: "not_implemented" as const,
    message:
      "Unsigned Orca/Raydium withdraw transaction is not wired yet. Use POST /api/liquidity/preview-withdraw for the SDK integration note.",
    poolAddress: parsed.poolAddress,
    venue: parsed.venue,
    unsignedTransactionBase64: null,
    transactionMessageHashSha256Base64: null,
    sdkNextStep: sdkNoteForWithdraw(parsed.venue, parsed.poolAddress),
    documentation:
      "When implemented, this endpoint should mirror POST /api/build (unsigned base64 + message hash for the signer). Dev-only stub: set env LP_DEV_STUB_LIQUIDITY_TX=1 and include userPublicKey in the body to receive a serializeable placeholder transaction.",
  };
}

export async function tryLiquidityDepositStub(
  env: Env,
  parsed: DepositParsed,
  deps?: LiquidityStubDeps,
) {
  if (!env.lpDevStubLiquidityTx || !parsed.userPublicKey) return null;
  try {
    const fetchBh =
      deps?.getLatestBlockhash ??
      (async () => {
        const rpc = new SolanaRpcClient(new Connection(env.SOLANA_RPC_URL, "confirmed"));
        return rpc.getLatestBlockhash();
      });
    const { blockhash } = await fetchBh();
    const stub = buildLiquidityDevStubVersionedTransaction({
      payer: parsed.userPublicKey,
      recentBlockhash: blockhash,
    });
    return {
      code: "LIQUIDITY_DEPOSIT_STUB" as const,
      message:
        "Dev-only: 0-lamport self-transfer placeholder. Do not treat as a real LP deposit; wire Orca/Raydium instructions instead.",
      poolAddress: parsed.poolAddress,
      venue: parsed.venue,
      unsignedTransactionBase64: stub.unsignedTransactionBase64,
      transactionMessageHashSha256Base64: stub.transactionMessageHashSha256Base64,
      recentBlockhash: blockhash,
      sdkNextStep: sdkNoteForDeposit(parsed.venue, parsed.poolAddress),
    };
  } catch {
    return null;
  }
}

export async function tryLiquidityWithdrawStub(
  env: Env,
  parsed: WithdrawParsed,
  deps?: LiquidityStubDeps,
) {
  if (!env.lpDevStubLiquidityTx || !parsed.userPublicKey) return null;
  try {
    const fetchBh =
      deps?.getLatestBlockhash ??
      (async () => {
        const rpc = new SolanaRpcClient(new Connection(env.SOLANA_RPC_URL, "confirmed"));
        return rpc.getLatestBlockhash();
      });
    const { blockhash } = await fetchBh();
    const stub = buildLiquidityDevStubVersionedTransaction({
      payer: parsed.userPublicKey,
      recentBlockhash: blockhash,
    });
    return {
      code: "LIQUIDITY_WITHDRAW_STUB" as const,
      message:
        "Dev-only: 0-lamport self-transfer placeholder. Do not treat as a real LP withdraw; wire Orca/Raydium instructions instead.",
      poolAddress: parsed.poolAddress,
      venue: parsed.venue,
      unsignedTransactionBase64: stub.unsignedTransactionBase64,
      transactionMessageHashSha256Base64: stub.transactionMessageHashSha256Base64,
      recentBlockhash: blockhash,
      sdkNextStep: sdkNoteForWithdraw(parsed.venue, parsed.poolAddress),
    };
  } catch {
    return null;
  }
}
