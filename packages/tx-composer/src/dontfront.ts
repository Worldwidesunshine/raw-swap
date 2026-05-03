import { PublicKey } from "@solana/web3.js";
import type { TransactionInstruction } from "@solana/web3.js";

const DONT_FRONT_PREFIX = "jitodontfront";
const DONT = new PublicKey("jitodontfront111111111111111111111111111111");

/**
 * Appends DontFront marker account (read-only) to an instruction for Jito sandwich protection.
 */
export function withDontFront(ix: TransactionInstruction): TransactionInstruction {
  return {
    programId: ix.programId,
    keys: [...ix.keys, { pubkey: DONT, isSigner: false, isWritable: false }],
    data: ix.data,
  };
}

export function getDontFrontPublicKey(): PublicKey {
  return DONT;
}

export { DONT_FRONT_PREFIX };
