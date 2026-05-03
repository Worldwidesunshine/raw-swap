import { createHash } from "node:crypto";
import { PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from "@solana/web3.js";

export type LiquidityStubTx = {
  unsignedTransactionBase64: string;
  transactionMessageHashSha256Base64: string;
};

/**
 * Dev-only placeholder `VersionedTransaction` (single 0-lamport self-transfer).
 * Parity with how swap builds serialize/hash messages; not a real LP instruction.
 * Accepts base58 payer here so the pubkey is constructed with this package's web3.js instance.
 */
export function buildLiquidityDevStubVersionedTransaction(args: {
  payer: PublicKey | string;
  recentBlockhash: string;
}): LiquidityStubTx {
  const payerKey = typeof args.payer === "string" ? new PublicKey(args.payer) : new PublicKey(args.payer.toBase58());
  const messageV0 = new TransactionMessage({
    payerKey,
    recentBlockhash: args.recentBlockhash,
    instructions: [
      SystemProgram.transfer({
        fromPubkey: payerKey,
        toPubkey: payerKey,
        lamports: 0,
      }),
    ],
  }).compileToV0Message([]);

  const tx = new VersionedTransaction(messageV0);
  const digest = createHash("sha256").update(Buffer.from(tx.message.serialize())).digest();
  return {
    unsignedTransactionBase64: Buffer.from(tx.serialize()).toString("base64"),
    transactionMessageHashSha256Base64: Buffer.from(digest).toString("base64"),
  };
}
