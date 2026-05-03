import { createHash } from "node:crypto";
import nacl from "tweetnacl";
import { PublicKey, VersionedTransaction } from "@solana/web3.js";

export type BuildRecordForVerify = {
  transactionMessageHash: string;
  userPublicKey: string;
  unsignedTransactionBase64: string;
};

export function verifySignedTransaction(
  signed: VersionedTransaction,
  build: BuildRecordForVerify,
): { ok: true } | { ok: false; reason: string } {
  let unsigned: VersionedTransaction;
  try {
    unsigned = VersionedTransaction.deserialize(Buffer.from(build.unsignedTransactionBase64, "base64"));
  } catch {
    return { ok: false, reason: "INVALID_UNSIGNED" };
  }
  const unsignedMsg = unsigned.message.serialize();
  const signedMsg = signed.message.serialize();
  if (!buffersEqual(unsignedMsg, signedMsg)) {
    return { ok: false, reason: "MESSAGE_MISMATCH" };
  }

  const digest = createHash("sha256").update(Buffer.from(signedMsg)).digest();
  const hashB64 = Buffer.from(digest).toString("base64");
  if (hashB64 !== build.transactionMessageHash) {
    return { ok: false, reason: "HASH_MISMATCH" };
  }

  const signer = new PublicKey(build.userPublicKey);
  const keys = signed.message.staticAccountKeys;
  if (!keys[0]?.equals(signer)) {
    return { ok: false, reason: "SIGNER_MISMATCH" };
  }

  if (unsigned.signatures.length !== signed.signatures.length) {
    return { ok: false, reason: "SIGNATURE_COUNT_MISMATCH" };
  }

  const numReq = signed.message.header.numRequiredSignatures;
  const msgBytes = new Uint8Array(signedMsg);
  for (let i = 0; i < numReq; i++) {
    const sig = signed.signatures[i];
    const key = keys[i];
    if (!key) return { ok: false, reason: "MISSING_ACCOUNT_KEY" };
    if (!sig || sig.every((b) => b === 0)) {
      return { ok: false, reason: "MISSING_SIGNATURE" };
    }
    if (!nacl.sign.detached.verify(msgBytes, sig, key.toBytes())) {
      return { ok: false, reason: "BAD_SIGNATURE" };
    }
  }

  return { ok: true };
}

function buffersEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
