/**
 * Create an Orca Whirlpool splash pool for RAWSWAP/SOL.
 *
 * Usage:
 *   DEPLOYER_KEYPAIR_PATH=~/rawswap-keys/deploy-authority.json \
 *   RAWSWAP_MINT=<mint pubkey from create-rawswap-token.ts> \
 *   RAWSWAP_RPC_URL=https://api.devnet.solana.com \
 *   INITIAL_SOL=10 \
 *   INITIAL_RAWSWAP=10000000 \
 *   npx tsx scripts/pools/orca-rawswap-sol-splash.ts [--dry-run]
 *
 * Prerequisites:
 *   1. RAWSWAP Token-2022 mint must exist (run create-rawswap-token.ts first)
 *   2. Deploy authority must hold RAWSWAP tokens + SOL for initial liquidity
 *   3. Install: pnpm add -D @orca-so/whirlpools-sdk @orca-so/common-sdk
 *
 * What this script does:
 *   1. Load deployer keypair + mint address
 *   2. Initialize a splash pool (full-range) at the Orca Whirlpools program
 *   3. Open a full-range position
 *   4. Deposit initial liquidity (SOL + RAWSWAP)
 *   5. Print the pool address for ORCA_RAWSWAP_SOL_POOL env var
 *
 * TODO: Wire actual @orca-so/whirlpools-sdk calls (see inline TODOs below).
 */
import * as fs from "node:fs";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

const SOL_MINT = "So11111111111111111111111111111111111111112";

function loadKeypair(path: string): Keypair {
  const raw = fs.readFileSync(path, "utf-8");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw) as number[]));
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const deployerPath = process.env.DEPLOYER_KEYPAIR_PATH;
  const rawswapMint = process.env.RAWSWAP_MINT;
  const rpcUrl = process.env.RAWSWAP_RPC_URL ?? "https://api.devnet.solana.com";
  const initialSol = Number(process.env.INITIAL_SOL ?? "10");
  const initialRawswap = Number(process.env.INITIAL_RAWSWAP ?? "10000000");

  if (!deployerPath || !rawswapMint) {
    console.error("Required env vars: DEPLOYER_KEYPAIR_PATH, RAWSWAP_MINT");
    console.error("Optional: RAWSWAP_RPC_URL, INITIAL_SOL, INITIAL_RAWSWAP");
    process.exit(1);
  }

  const deployer = loadKeypair(deployerPath);
  const connection = new Connection(rpcUrl, "confirmed");
  const mint = new PublicKey(rawswapMint);

  console.log("═══ Orca Whirlpool Splash Pool Creation ═══");
  console.log(`  RPC:            ${rpcUrl}`);
  console.log(`  Deployer:       ${deployer.publicKey.toBase58()}`);
  console.log(`  RAWSWAP Mint:   ${mint.toBase58()}`);
  console.log(`  SOL Mint:       ${SOL_MINT}`);
  console.log(`  Initial SOL:    ${initialSol}`);
  console.log(`  Initial RAW:    ${initialRawswap.toLocaleString()}`);
  console.log(`  Fee Tier:       30 bps (splash pool)`);
  console.log(`  Dry Run:        ${dryRun}`);

  if (dryRun) {
    console.log("\n🔍 DRY RUN — no on-chain transactions will be submitted.");
    console.log("\nTo execute for real, remove --dry-run flag.");
    return;
  }

  // TODO: Wire @orca-so/whirlpools-sdk
  //
  // import { WhirlpoolContext, buildWhirlpoolClient, ORCA_WHIRLPOOL_PROGRAM_ID } from "@orca-so/whirlpools-sdk";
  // import { Wallet } from "@orca-so/common-sdk";
  //
  // const wallet = new Wallet(deployer);
  // const ctx = WhirlpoolContext.from(connection, wallet, ORCA_WHIRLPOOL_PROGRAM_ID);
  // const client = buildWhirlpoolClient(ctx);
  //
  // // 1. Create the splash pool (full-range, 30bps fee tier, tick spacing 64)
  // const { poolAddress, tx: createTx } = await client.createPool(
  //   ORCA_WHIRLPOOLS_CONFIG, // Orca config address (mainnet or devnet)
  //   new PublicKey(SOL_MINT),
  //   mint,
  //   64, // tick spacing for splash pools
  //   initialPrice, // sqrt price based on SOL/RAWSWAP ratio
  // );
  // await createTx.buildAndExecute();
  //
  // // 2. Open full-range position + deposit initial liquidity
  // const pool = await client.getPool(poolAddress);
  // const { tx: positionTx } = await pool.openPosition(
  //   MIN_TICK, MAX_TICK, // full range
  //   { tokenA: initialSolLamports, tokenB: initialRawswapRaw },
  // );
  // await positionTx.buildAndExecute();
  //
  // console.log("Pool created:", poolAddress.toBase58());
  // console.log("Set: ORCA_RAWSWAP_SOL_POOL=" + poolAddress.toBase58());

  console.log("\n⚠️  Orca SDK not yet wired. Install @orca-so/whirlpools-sdk and replace TODOs above.");
  console.log("  pnpm add -D @orca-so/whirlpools-sdk @orca-so/common-sdk");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
