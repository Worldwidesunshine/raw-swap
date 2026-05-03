import {
  Connection,
  Keypair,
  VersionedTransaction,
} from "@solana/web3.js";
import { request } from "undici";
import { compounderLogJson } from "./log.js";

const JUPITER_SWAP_V2 = "https://api.jup.ag/swap/v2";
const SOL_MINT = "So11111111111111111111111111111111111111112";

export type BuybackResult = {
  signature: string;
  inputLamports: bigint;
  outputRawswapRaw: string;
  route: string;
};

/**
 * Execute a Jupiter SOL → RAWSWAP buyback swap.
 *
 * Flow:
 *   1. GET /build with inputMint=SOL, outputMint=RAWSWAP, amount, taker=compounder
 *   2. Jupiter returns instructions + blockhash
 *   3. Build VersionedTransaction, sign with compounder keypair
 *   4. Submit via RPC
 *   5. Return signature + amounts
 */
export async function executeJupiterBuyback(args: {
  connection: Connection;
  compounderKeypair: Keypair;
  rawswapMint: string;
  amountLamports: bigint;
  slippageBps?: number;
  apiKey?: string;
}): Promise<BuybackResult> {
  const { connection, compounderKeypair, rawswapMint, amountLamports, slippageBps = 100, apiKey = "" } = args;

  const takerPubkey = compounderKeypair.publicKey.toBase58();

  compounderLogJson("info", "buyback: fetching Jupiter build", {
    inputMint: SOL_MINT,
    outputMint: rawswapMint,
    amount: amountLamports.toString(),
    taker: takerPubkey,
    slippageBps,
  });

  // 1. Get build response from Jupiter (instructions + blockhash)
  const params = new URLSearchParams({
    inputMint: SOL_MINT,
    outputMint: rawswapMint,
    amount: amountLamports.toString(),
    slippageBps: String(slippageBps),
    taker: takerPubkey,
  });

  const buildUrl = `${JUPITER_SWAP_V2}/build?${params.toString()}`;
  const buildRes = await request(buildUrl, {
    method: "GET",
    headers: {
      accept: "application/json",
      ...(apiKey ? { "x-api-key": apiKey } : {}),
    },
    headersTimeout: 30_000,
    bodyTimeout: 30_000,
  });

  if (buildRes.statusCode >= 400) {
    const body = await buildRes.body.text();
    throw new Error(`Jupiter build failed (HTTP ${buildRes.statusCode}): ${body.slice(0, 500)}`);
  }

  const buildJson = (await buildRes.body.json()) as {
    swapTransaction?: string;
    transaction?: string;
    outAmount?: string;
    routePlan?: { swapInfo?: { label?: string } }[];
  };

  // Jupiter V2 /build returns a base64 serialized transaction
  const txBase64 = buildJson.swapTransaction ?? buildJson.transaction;
  if (!txBase64 || typeof txBase64 !== "string") {
    throw new Error("Jupiter build did not return a swapTransaction");
  }

  // 2. Deserialize, sign, and submit
  const txBuf = Buffer.from(txBase64, "base64");
  const vtx = VersionedTransaction.deserialize(txBuf);

  vtx.sign([compounderKeypair]);

  compounderLogJson("info", "buyback: submitting signed transaction");

  const signature = await connection.sendRawTransaction(vtx.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });

  // 3. Confirm
  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  await connection.confirmTransaction(
    { signature, ...latestBlockhash },
    "confirmed",
  );

  const routeLabels = (buildJson.routePlan ?? [])
    .map((s) => s.swapInfo?.label ?? "?")
    .join(" → ");

  compounderLogJson("info", "buyback: confirmed", {
    signature,
    outAmount: buildJson.outAmount,
    route: routeLabels,
  });

  return {
    signature,
    inputLamports: amountLamports,
    outputRawswapRaw: buildJson.outAmount ?? "0",
    route: routeLabels || "unknown",
  };
}

/**
 * Plan a buyback — check if conditions are met, return the planned amount.
 * Reserves a small amount of SOL in the vault for rent exemption.
 */
export function planBuybackAmount(
  vaultBalanceLamports: bigint,
  thresholdLamports: number,
): bigint | null {
  if (vaultBalanceLamports < BigInt(thresholdLamports)) return null;

  // Reserve 0.01 SOL for rent exemption in the vault
  const RENT_RESERVE = 10_000_000n;
  const available = vaultBalanceLamports - RENT_RESERVE;

  if (available <= 0n) return null;
  return available;
}
