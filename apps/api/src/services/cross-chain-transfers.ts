import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { crossChainTransfers } from "../db/schema/cross-chain-transfers.js";
import {
  RawSwapError,
  crossChainTransferPatchSchema,
  crossChainTransferRecordSchema,
  crossChainTransferCreateSchema,
  type CrossChainTransferRecord,
} from "@rawswap/shared";

function rowToRecord(row: typeof crossChainTransfers.$inferSelect): CrossChainTransferRecord {
  return crossChainTransferRecordSchema.parse({
    id: row.id,
    provider: row.provider,
    orderId: row.orderId,
    sourceChain: row.sourceChain,
    destChain: row.destChain,
    status: row.status,
    amountIn: row.amountIn,
    amountOut: row.amountOut,
    mintIn: row.mintIn,
    mintOut: row.mintOut,
    walletPublicKey: row.walletPublicKey,
    metadata: row.metadata ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

export async function createCrossChainTransfer(body: unknown): Promise<CrossChainTransferRecord> {
  const parsed = crossChainTransferCreateSchema.safeParse(body);
  if (!parsed.success) {
    throw new RawSwapError("INVALID_REQUEST", {
      message: "Cross-chain transfer body is invalid.",
      details: { issues: parsed.error.flatten() },
    });
  }
  const data = parsed.data;
  const [row] = await getDb()
    .insert(crossChainTransfers)
    .values({
      provider: data.provider,
      orderId: data.orderId ?? null,
      sourceChain: data.sourceChain,
      destChain: data.destChain,
      status: "created",
      amountIn: data.amountIn ?? null,
      amountOut: data.amountOut ?? null,
      mintIn: data.mintIn ?? null,
      mintOut: data.mintOut ?? null,
      walletPublicKey: data.walletPublicKey ?? null,
      metadata: data.metadata ?? null,
    })
    .returning();
  if (!row) throw new RawSwapError("BUILD_FAILED", { message: "Insert failed", retryable: true });
  return rowToRecord(row);
}

export async function getCrossChainTransferById(id: string): Promise<CrossChainTransferRecord | null> {
  const rows = await getDb()
    .select()
    .from(crossChainTransfers)
    .where(eq(crossChainTransfers.id, id))
    .limit(1);
  const row = rows[0];
  return row ? rowToRecord(row) : null;
}

export async function getCrossChainTransfersByOrderId(
  orderId: string,
  walletPublicKey?: string,
): Promise<CrossChainTransferRecord[]> {
  const whereClause = walletPublicKey
    ? and(
        eq(crossChainTransfers.orderId, orderId),
        eq(crossChainTransfers.walletPublicKey, walletPublicKey),
      )
    : eq(crossChainTransfers.orderId, orderId);
  const rows = await getDb()
    .select()
    .from(crossChainTransfers)
    .where(whereClause)
    .orderBy(desc(crossChainTransfers.createdAt))
    .limit(20);
  return rows.map(rowToRecord);
}

export async function listRecentCrossChainTransfers(args: {
  walletPublicKey?: string;
  limit: number;
}): Promise<CrossChainTransferRecord[]> {
  const lim = Math.min(Math.max(args.limit, 1), 100);
  const qb = getDb().select().from(crossChainTransfers);
  const rows = args.walletPublicKey
    ? await qb
        .where(eq(crossChainTransfers.walletPublicKey, args.walletPublicKey))
        .orderBy(desc(crossChainTransfers.createdAt))
        .limit(lim)
    : await qb.orderBy(desc(crossChainTransfers.createdAt)).limit(lim);
  return rows.map(rowToRecord);
}

export async function patchCrossChainTransfer(
  id: string,
  body: unknown,
): Promise<CrossChainTransferRecord | null> {
  const parsed = crossChainTransferPatchSchema.safeParse(body);
  if (!parsed.success) {
    throw new RawSwapError("INVALID_REQUEST", {
      message: "Cross-chain transfer patch body is invalid.",
      details: { issues: parsed.error.flatten() },
    });
  }
  const patch = parsed.data;
  const [row] = await getDb()
    .update(crossChainTransfers)
    .set({
      status: patch.status,
      ...(patch.metadata !== undefined ? { metadata: patch.metadata } : {}),
      updatedAt: new Date(),
    })
    .where(eq(crossChainTransfers.id, id))
    .returning();
  return row ? rowToRecord(row) : null;
}
