import { PublicKey, TransactionInstruction } from "@solana/web3.js";

export type JupiterIxJson = {
  programId: string;
  accounts: { pubkey: string; isWritable: boolean; isSigner: boolean }[];
  data: string;
};

export function instructionFromJupiterJson(ix: JupiterIxJson): TransactionInstruction {
  return new TransactionInstruction({
    programId: new PublicKey(ix.programId),
    keys: ix.accounts.map((a) => ({
      pubkey: new PublicKey(a.pubkey),
      isWritable: a.isWritable,
      isSigner: a.isSigner,
    })),
    data: Buffer.from(ix.data, "base64"),
  });
}

export function instructionsFromJupiterJson(
  ixs: JupiterIxJson[] | undefined | null,
): TransactionInstruction[] {
  if (!ixs?.length) return [];
  return ixs.map(instructionFromJupiterJson);
}
