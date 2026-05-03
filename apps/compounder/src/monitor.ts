import { Connection, PublicKey } from "@solana/web3.js";

/**
 * Monitor protocol fee vault balance on-chain.
 * Returns the current SOL balance in lamports.
 */
export async function pollFeeVaultLamports(
  connection: Connection,
  feeVaultPubkey: PublicKey,
): Promise<bigint> {
  const balance = await connection.getBalance(feeVaultPubkey, "confirmed");
  return BigInt(balance);
}

/**
 * Check if the fee vault has accumulated enough SOL to trigger a buyback.
 */
export function shouldTriggerBuyback(
  vaultBalanceLamports: bigint,
  thresholdLamports: number,
): boolean {
  return vaultBalanceLamports >= BigInt(thresholdLamports);
}
