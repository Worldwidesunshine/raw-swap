/**
 * Create the RAWSWAP SPL Token-2022 mint with on-chain metadata.
 *
 * Usage:
 *   DEPLOYER_KEYPAIR_PATH=~/rawswap-keys/deploy-authority.json \
 *   RAWSWAP_RPC_URL=http://localhost:8899 \
 *   npx tsx scripts/create-rawswap-token.ts [--revoke-authorities] [--dry-run]
 */
import * as fs from "node:fs";
import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMint2Instruction,
  createMintToInstruction,
  getMintLen,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  AuthorityType,
  createSetAuthorityInstruction,
  createInitializeMetadataPointerInstruction,
  tokenMetadataInitializeWithRentTransfer,
} from "@solana/spl-token";

/* ─── Config ─── */
const TOKEN_NAME = "RawSwap";
const TOKEN_SYMBOL = "RAW";
const TOKEN_URI = "https://rawswap.io/token-metadata.json";
const TOKEN_DECIMALS = 6;
const TOTAL_SUPPLY = 1_000_000_000; // 1 billion
const TOTAL_SUPPLY_RAW = BigInt(TOTAL_SUPPLY) * BigInt(10 ** TOKEN_DECIMALS);

/* ─── Helpers ─── */
function loadKeypair(path: string): Keypair {
  const raw = fs.readFileSync(path, "utf-8");
  const secret = Uint8Array.from(JSON.parse(raw) as number[]);
  return Keypair.fromSecretKey(secret);
}

async function main() {
  const args = process.argv.slice(2);
  const revokeAuthorities = args.includes("--revoke-authorities");
  const dryRun = args.includes("--dry-run");

  /* ─── Load deployer ─── */
  const deployerPath = process.env.DEPLOYER_KEYPAIR_PATH;
  if (!deployerPath) {
    console.error("ERROR: Set DEPLOYER_KEYPAIR_PATH to your deploy authority keypair JSON file.");
    process.exit(1);
  }
  const deployer = loadKeypair(deployerPath);
  console.log(`Deployer: ${deployer.publicKey.toBase58()}`);

  /* ─── Connect ─── */
  const rpcUrl = process.env.RAWSWAP_RPC_URL ?? "https://api.devnet.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");
  const version = await connection.getVersion();
  console.log(`RPC: ${rpcUrl} (solana-core ${version["solana-core"]})`);

  const balance = await connection.getBalance(deployer.publicKey);
  console.log(`Deployer balance: ${(balance / 1e9).toFixed(4)} SOL`);
  if (balance < 0.05e9) {
    console.error("ERROR: Deployer needs at least 0.05 SOL.");
    process.exit(1);
  }

  /* ─── Generate mint keypair ─── */
  const mintKeypair = Keypair.generate();
  console.log(`\nMint keypair generated: ${mintKeypair.publicKey.toBase58()}`);

  /* ─── Phase 1: Create account + Pointer + InitMint ─── */
  // Allocate space for mint + MetadataPointer extension ONLY.
  // Metadata content is added in Phase 2 via tokenMetadataInitializeWithRentTransfer
  // which automatically extends the account and transfers additional rent.
  const mintLen = getMintLen([ExtensionType.MetadataPointer]);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

  console.log(`Mint account size: ${mintLen} bytes (${(lamports / 1e9).toFixed(6)} SOL rent)`);

  if (dryRun) {
    const deployerAta = getAssociatedTokenAddressSync(
      mintKeypair.publicKey, deployer.publicKey, false, TOKEN_2022_PROGRAM_ID,
    );
    console.log("\n🔍 DRY RUN — transaction not submitted.");
    console.log("  Mint:     ", mintKeypair.publicKey.toBase58());
    console.log("  Supply:   ", TOTAL_SUPPLY.toLocaleString(), TOKEN_SYMBOL);
    console.log("  Decimals: ", TOKEN_DECIMALS);
    console.log("  Deployer ATA:", deployerAta.toBase58());
    console.log("  Authorities revoked:", revokeAuthorities);
    return;
  }

  // Transaction 1: Create account + Init pointer + Init mint
  const tx1 = new Transaction();
  tx1.add(
    SystemProgram.createAccount({
      fromPubkey: deployer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
  );
  tx1.add(
    createInitializeMetadataPointerInstruction(
      mintKeypair.publicKey,
      deployer.publicKey,
      mintKeypair.publicKey, // metadata lives on the mint account itself
      TOKEN_2022_PROGRAM_ID,
    ),
  );
  tx1.add(
    createInitializeMint2Instruction(
      mintKeypair.publicKey,
      TOKEN_DECIMALS,
      deployer.publicKey,
      deployer.publicKey,
      TOKEN_2022_PROGRAM_ID,
    ),
  );

  console.log("\nSubmitting TX 1/3: Create account + Init pointer + Init mint...");
  const sig1 = await sendAndConfirmTransaction(
    connection, tx1, [deployer, mintKeypair], { commitment: "confirmed" },
  );
  console.log(`  ✅ TX 1 confirmed: ${sig1}`);

  /* ─── Phase 2: Add metadata (extends account + transfers extra rent) ─── */
  console.log("\nSubmitting TX 2/3: Initialize on-chain metadata...");
  await tokenMetadataInitializeWithRentTransfer(
    connection,
    deployer, // payer
    mintKeypair.publicKey, // mint
    deployer.publicKey, // update authority
    deployer.publicKey, // mint authority
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_URI,
    undefined, // multiSigners
    "confirmed",
    TOKEN_2022_PROGRAM_ID,
  );
  console.log(`  ✅ TX 2 confirmed: metadata initialized`);

  /* ─── Phase 3: Create ATA + Mint supply ─── */
  const deployerAta = getAssociatedTokenAddressSync(
    mintKeypair.publicKey, deployer.publicKey, false, TOKEN_2022_PROGRAM_ID,
  );

  const tx3 = new Transaction();
  tx3.add(
    createAssociatedTokenAccountInstruction(
      deployer.publicKey, deployerAta, deployer.publicKey, mintKeypair.publicKey, TOKEN_2022_PROGRAM_ID,
    ),
  );
  tx3.add(
    createMintToInstruction(
      mintKeypair.publicKey, deployerAta, deployer.publicKey, TOTAL_SUPPLY_RAW, [], TOKEN_2022_PROGRAM_ID,
    ),
  );

  // Optionally revoke authorities
  if (revokeAuthorities) {
    console.log("\n⚠️  Revoking mint and freeze authorities (permanent)...");
    tx3.add(
      createSetAuthorityInstruction(
        mintKeypair.publicKey, deployer.publicKey, AuthorityType.MintTokens, null, [], TOKEN_2022_PROGRAM_ID,
      ),
    );
    tx3.add(
      createSetAuthorityInstruction(
        mintKeypair.publicKey, deployer.publicKey, AuthorityType.FreezeAccount, null, [], TOKEN_2022_PROGRAM_ID,
      ),
    );
  }

  console.log("\nSubmitting TX 3/3: Create ATA + Mint 1B RAW...");
  const sig3 = await sendAndConfirmTransaction(
    connection, tx3, [deployer], { commitment: "confirmed" },
  );
  console.log(`  ✅ TX 3 confirmed: ${sig3}`);

  console.log("\n✅ RAWSWAP token created successfully!");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  Mint:          ${mintKeypair.publicKey.toBase58()}`);
  console.log(`  Supply:        ${TOTAL_SUPPLY.toLocaleString()} ${TOKEN_SYMBOL}`);
  console.log(`  Decimals:      ${TOKEN_DECIMALS}`);
  console.log(`  Deployer ATA:  ${deployerAta.toBase58()}`);
  console.log(`  Authorities:   ${revokeAuthorities ? "REVOKED (immutable)" : "deployer retains"}`);
  console.log("═══════════════════════════════════════════════════");
  console.log(`\n📋 Set this in your .env files:`);
  console.log(`  RAWSWAP_MINT=${mintKeypair.publicKey.toBase58()}`);

  // Save mint keypair
  const mintKeyPath = deployerPath.replace(/[^/]+$/, "rawswap-mint.json");
  fs.writeFileSync(mintKeyPath, JSON.stringify(Array.from(mintKeypair.secretKey)));
  console.log(`\n💾 Mint keypair saved: ${mintKeyPath}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
