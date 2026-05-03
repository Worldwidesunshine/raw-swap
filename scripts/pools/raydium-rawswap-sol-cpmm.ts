/**
 * Create a Raydium CPMM pool for RAWSWAP/SOL.
 *
 * Usage:
 *   DEPLOYER_KEYPAIR_PATH=~/rawswap-keys/deploy-authority.json \
 *   RAWSWAP_MINT=<mint pubkey from create-rawswap-token.ts> \
 *   RAWSWAP_RPC_URL=https://api.devnet.solana.com \
 *   INITIAL_SOL=10 \
 *   INITIAL_RAWSWAP=10000000 \
 *   npx tsx scripts/pools/raydium-rawswap-sol-cpmm.ts [--dry-run]
 *
 * Prerequisites:
 *   1. RAWSWAP Token-2022 mint must exist (run create-rawswap-token.ts first)
 *   2. Deploy authority must hold RAWSWAP tokens + SOL for initial liquidity
 *   3. Install: pnpm add -D @raydium-io/raydium-sdk-v2
 *
 * What this script does:
 *   1. Load deployer keypair + mint address
 *   2. Create a CPMM pool via Raydium SDK
 *   3. Deposit initial liquidity (SOL + RAWSWAP)
 *   4. Print the pool address for RAYDIUM_RAWSWAP_SOL_POOL env var
 *
 * TODO: Wire actual @raydium-io/raydium-sdk-v2 calls (see inline TODOs below).
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

  console.log("═══ Raydium CPMM Pool Creation ═══");
  console.log(`  RPC:            ${rpcUrl}`);
  console.log(`  Deployer:       ${deployer.publicKey.toBase58()}`);
  console.log(`  RAWSWAP Mint:   ${mint.toBase58()}`);
  console.log(`  SOL Mint:       ${SOL_MINT}`);
  console.log(`  Initial SOL:    ${initialSol}`);
  console.log(`  Initial RAW:    ${initialRawswap.toLocaleString()}`);
  console.log(`  Fee Tier:       25 bps (CPMM)`);
  console.log(`  Dry Run:        ${dryRun}`);

  if (dryRun) {
    console.log("\n🔍 DRY RUN — no on-chain transactions will be submitted.");
    console.log("\nTo execute for real, remove --dry-run flag.");
    return;
  }

  // TODO: Wire @raydium-io/raydium-sdk-v2
  //
  // import { Raydium } from "@raydium-io/raydium-sdk-v2";
  //
  // const raydium = await Raydium.load({
  //   connection,
  //   owner: deployer,
  //   cluster: "devnet", // or "mainnet"
  // });
  //
  // // 1. Create CPMM pool with initial liquidity
  // const { execute, extInfo } = await raydium.cpmm.createPool({
  //   programId: CPMM_PROGRAM_ID,     // Raydium CPMM program
  //   poolFeeAccount: POOL_FEE_ACCOUNT, // Raydium fee account
  //   mintA: { address: SOL_MINT, programId: TOKEN_PROGRAM_ID },
  //   mintB: { address: rawswapMint, programId: TOKEN_2022_PROGRAM_ID },
  //   mintAAmount: new BN(initialSol * 1e9),     // lamports
  //   mintBAmount: new BN(initialRawswap * 1e6),  // raw units (6 decimals)
  //   startTime: new BN(0), // start immediately
  // });
  //
  // const { txId } = await execute({ sendAndConfirm: true });
  // console.log("Pool created:", extInfo.address.toBase58());
  // console.log("Tx:", txId);
  // console.log("Set: RAYDIUM_RAWSWAP_SOL_POOL=" + extInfo.address.toBase58());

  console.log("\n⚠️  Raydium SDK not yet wired. Install @raydium-io/raydium-sdk-v2 and replace TODOs above.");
  console.log("  pnpm add -D @raydium-io/raydium-sdk-v2");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
