import { createHash } from "node:crypto";
import type { PublicKey, VersionedTransaction } from "@solana/web3.js";

export type TransactionFingerprint = {
  messageHashSha256Base64: string;
  expectedSigner: string;
  instructionProgramIds: string[];
  writableAccounts: string[];
  readonlyAccounts: string[];
  lookupTableAccounts: string[];
  loadedWritableAccounts: string[];
  loadedReadonlyAccounts: string[];
  inputMint: string;
  outputMint: string;
  minimumOutputAmount: string;
  /** Present when protocol SOL transfers were composed into the swap transaction. */
  protocolFee?: {
    buybackLamports: string;
    treasuryLamports: string;
    totalLamports: string;
  };
};

export function computeMessageHashBase64FromTx(tx: VersionedTransaction): string {
  const digest = createHash("sha256").update(Buffer.from(tx.message.serialize())).digest();
  return Buffer.from(digest).toString("base64");
}

function isStaticAccountWritable(message: VersionedTransaction["message"], index: number): boolean {
  const { header, staticAccountKeys } = message;
  const n = staticAccountKeys.length;
  const sig = header.numRequiredSignatures;
  const roSigned = header.numReadonlySignedAccounts;
  const roUnsigned = header.numReadonlyUnsignedAccounts;
  if (index < sig) {
    return index < sig - roSigned;
  }
  if (index >= n) return false;
  return index < n - roUnsigned;
}

export function computeFingerprint(
  tx: VersionedTransaction,
  meta: {
    expectedSigner: PublicKey;
    inputMint: string;
    outputMint: string;
    minimumOutputAmount: string;
    protocolFee?: { buyback: bigint; treasury: bigint };
    lookupTableAccounts?: {
      key: PublicKey;
      state: { addresses: readonly PublicKey[] };
    }[];
  },
): TransactionFingerprint {
  const messageHashSha256Base64 = computeMessageHashBase64FromTx(tx);
  const writableAccounts: string[] = [];
  const readonlyAccounts: string[] = [];
  tx.message.staticAccountKeys.forEach((k, i) => {
    const b58 = k.toBase58();
    if (isStaticAccountWritable(tx.message, i)) writableAccounts.push(b58);
    else readonlyAccounts.push(b58);
  });
  const programIds = tx.message.compiledInstructions.map((ix) =>
    tx.message.staticAccountKeys[ix.programIdIndex]!.toBase58(),
  );
  const luts =
    "addressTableLookups" in tx.message && tx.message.addressTableLookups
      ? tx.message.addressTableLookups.map((l) => l.accountKey.toBase58())
      : [];
  const lookupTableByKey = new Map(
    (meta.lookupTableAccounts ?? []).map((table) => [table.key.toBase58(), table]),
  );
  const loadedWritableAccounts: string[] = [];
  const loadedReadonlyAccounts: string[] = [];
  if ("addressTableLookups" in tx.message && tx.message.addressTableLookups) {
    for (const lookup of tx.message.addressTableLookups) {
      const table = lookupTableByKey.get(lookup.accountKey.toBase58());
      if (!table) continue;
      for (const index of lookup.writableIndexes) {
        const account = table.state.addresses[index];
        if (account) loadedWritableAccounts.push(account.toBase58());
      }
      for (const index of lookup.readonlyIndexes) {
        const account = table.state.addresses[index];
        if (account) loadedReadonlyAccounts.push(account.toBase58());
      }
    }
  }

  const protocolFee =
    meta.protocolFee && (meta.protocolFee.buyback > 0n || meta.protocolFee.treasury > 0n)
      ? {
          buybackLamports: meta.protocolFee.buyback.toString(),
          treasuryLamports: meta.protocolFee.treasury.toString(),
          totalLamports: (meta.protocolFee.buyback + meta.protocolFee.treasury).toString(),
        }
      : undefined;

  return {
    messageHashSha256Base64,
    expectedSigner: meta.expectedSigner.toBase58(),
    instructionProgramIds: [...new Set(programIds)],
    writableAccounts,
    readonlyAccounts,
    lookupTableAccounts: luts,
    loadedWritableAccounts,
    loadedReadonlyAccounts,
    inputMint: meta.inputMint,
    outputMint: meta.outputMint,
    minimumOutputAmount: meta.minimumOutputAmount,
    protocolFee,
  };
}
