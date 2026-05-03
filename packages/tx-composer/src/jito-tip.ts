import { SystemProgram, type PublicKey, TransactionInstruction, LAMPORTS_PER_SOL } from "@solana/web3.js";

export function transferSolTipIx(from: PublicKey, to: PublicKey, lamports: number): TransactionInstruction {
  return SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports });
}

export { LAMPORTS_PER_SOL };
