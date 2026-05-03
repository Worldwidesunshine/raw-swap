import { PublicKey, SystemProgram, type TransactionInstruction } from "@solana/web3.js";

export type ProtocolFeeSolParams = {
  payer: PublicKey;
  inputAmountLamports: bigint;
  feeVault: PublicKey;
  treasuryWallet: PublicKey;
  buybackBps: number;
  treasuryBps: number;
};

const MAX_SAFE_LAMPORTS = BigInt(Number.MAX_SAFE_INTEGER);

function toU64Lamports(n: bigint): number {
  if (n > MAX_SAFE_LAMPORTS) {
    throw new Error(`Protocol fee lamports exceed JS safe integer: ${n.toString()}`);
  }
  return Number(n);
}

/**
 * SOL / wSOL input only: append native SOL transfers after swap cleanup, before Jito tip.
 */
export function protocolFeeSolTransfers(params: ProtocolFeeSolParams): TransactionInstruction[] {
  const { payer, inputAmountLamports, feeVault, treasuryWallet, buybackBps, treasuryBps } = params;
  if (buybackBps <= 0 && treasuryBps <= 0) return [];

  const buybackFee = (inputAmountLamports * BigInt(buybackBps)) / 10000n;
  const treasuryFee = (inputAmountLamports * BigInt(treasuryBps)) / 10000n;

  const ixs: TransactionInstruction[] = [];
  if (buybackFee > 0n) {
    ixs.push(
      SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: feeVault,
        lamports: toU64Lamports(buybackFee),
      }),
    );
  }
  if (treasuryFee > 0n) {
    ixs.push(
      SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: treasuryWallet,
        lamports: toU64Lamports(treasuryFee),
      }),
    );
  }
  return ixs;
}
