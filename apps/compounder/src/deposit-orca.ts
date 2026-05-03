import type { Connection, Keypair } from "@solana/web3.js";
import { compounderLogJson } from "./log.js";

/**
 * Deposit purchased RAWSWAP + matched SOL into the Orca Whirlpool permanent LP position.
 *
 * TODO (Wave 05-06): Wire @orca-so/whirlpools-sdk:
 *   1. Fetch pool state via WhirlpoolData
 *   2. Calculate optimal tick range for splash pool (full range)
 *   3. Build increaseLiquidity or openPosition + increaseLiquidity IXs
 *   4. Sign with compounder keypair
 *   5. Submit
 *
 * For now, logs the intent and returns null (buyback SOL→RAWSWAP still executes).
 */
export async function depositToOrcaPermanentLp(args: {
  connection: Connection;
  compounderKeypair: Keypair;
  poolAddress: string;
  rawswapAmount: string;
  solLamports: bigint;
}): Promise<{ signature: string } | null> {
  compounderLogJson("info", "orca LP deposit planned (SDK not yet wired)", {
    pool: args.poolAddress,
    rawswapAmount: args.rawswapAmount,
    solLamports: args.solLamports.toString(),
    compounder: args.compounderKeypair.publicKey.toBase58(),
  });

  // TODO: Replace with actual Orca SDK calls:
  // import { WhirlpoolContext, buildWhirlpoolClient } from "@orca-so/whirlpools-sdk";
  // const ctx = WhirlpoolContext.from(connection, wallet, ORCA_WHIRLPOOL_PROGRAM_ID);
  // const client = buildWhirlpoolClient(ctx);
  // const pool = await client.getPool(new PublicKey(args.poolAddress));
  // const tx = await pool.openPosition(...).addLiquidity(...);
  // const sig = await tx.buildAndExecute();

  return null;
}
