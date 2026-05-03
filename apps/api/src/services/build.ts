import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { AddressLookupTableAccount, Connection, PublicKey } from "@solana/web3.js";
import {
  RawSwapError,
  buildRequestSchema,
  SOL_MINT,
  BUYBACK_FEE_BPS,
  TREASURY_FEE_BPS,
  splitProtocolFeeFromInput,
} from "@rawswap/shared";
import { composeSwapTransaction, type ComposeOptions, type JupiterBuildResponse } from "@rawswap/tx-composer";
import { computeFingerprint } from "@rawswap/tx-verifier";
import { getBuildInstructions, jupiterBuildResponseSchema } from "../clients/jupiter.js";
import { getDb } from "../db/index.js";
import { transactionBuilds } from "../db/schema/transaction-builds.js";
import { JitoJsonRpcClient } from "../clients/jito.js";
import { loadJsonConfig } from "../utils/config-loader.js";
import { REPO_ROOT } from "../utils/repo-root.js";
import type { Env } from "../env.js";
import { normalizeUpstreamError } from "../utils/upstream-errors.js";
import { getQuoteRecord } from "./quote.js";
import {
  formatUiAmount,
  getSupportedTokenByMint,
  readStoredQuoteMeta,
} from "../utils/token-catalog.js";

type UrgencyFile = Record<
  string,
  {
    computeUnitPriceMicroLamports: number;
    jitoTipLamports: number;
    maxTotalFeeLamports: number;
    internalOnly?: boolean;
  }
>;

type ProviderAmounts = {
  inputAmount: string;
  expectedOutputAmount: string;
  minimumOutputAmount: string;
  priceImpactPct: string;
};

type RiskPolicy = {
  maxSlippageBps: number;
  maxPriorityFeeLamports: number;
  maxJitoTipLamports: number;
  maxProtocolFeeLamports?: number;
};

function parsePositiveBigInt(amountStr: string): bigint {
  try {
    const x = BigInt(amountStr);
    if (x <= 0n) throw new Error("non-positive");
    return x;
  } catch {
    throw new RawSwapError("BUILD_FAILED", {
      message: "Input amount is not a valid positive integer for fee calculation.",
      retryable: false,
    });
  }
}

function lamportsToSafeNumber(lamports: bigint, label: string): number {
  const max = BigInt(Number.MAX_SAFE_INTEGER);
  if (lamports > max) {
    throw new RawSwapError("BUILD_FAILED", {
      message: `Protocol fee (${label}) exceeds safe integer range for persistence.`,
      retryable: false,
    });
  }
  return Number(lamports);
}

/** Must match `composeSwapTransaction` default in @rawswap/tx-composer */
const DEFAULT_COMPUTE_UNIT_LIMIT = 1_400_000;

function estimatedPriorityFeeLamports(
  computeUnitPriceMicroLamports: number,
  computeUnitLimit: number,
): number {
  return Math.ceil((computeUnitPriceMicroLamports * computeUnitLimit) / 1_000_000);
}

function extractProviderAmounts(
  data: Record<string, unknown>,
  fallback: {
    inputAmount: string;
    expectedOutputAmount: string;
    minimumOutputAmount: string;
    priceImpactPct: string | null;
  },
): ProviderAmounts {
  return {
    inputAmount: String(data.inAmount ?? data.amount ?? fallback.inputAmount),
    expectedOutputAmount: String(data.outAmount ?? fallback.expectedOutputAmount),
    minimumOutputAmount: String(
      data.otherAmountThreshold ?? data.outAmount ?? fallback.minimumOutputAmount,
    ),
    priceImpactPct: String(data.priceImpactPct ?? data.priceImpact ?? fallback.priceImpactPct ?? "0"),
  };
}

let riskPolicyCache: RiskPolicy | null = null;
let urgencyProfilesCache: UrgencyFile | null = null;

function getRiskPolicy(): RiskPolicy {
  if (!riskPolicyCache) {
    riskPolicyCache = loadJsonConfig<RiskPolicy>(
      path.join(REPO_ROOT, "config", "risk-policy.json"),
    );
  }
  return riskPolicyCache;
}

function getUrgencyProfiles(): UrgencyFile {
  if (!urgencyProfilesCache) {
    urgencyProfilesCache = loadJsonConfig<UrgencyFile>(
      path.join(REPO_ROOT, "config", "urgency-profiles.json"),
    );
  }
  return urgencyProfilesCache;
}

async function resolveLookupTableAccounts(
  connection: Connection,
  lookupTableAddresses: Record<string, string[]> | undefined,
): Promise<AddressLookupTableAccount[]> {
  if (!lookupTableAddresses) return [];

  const resolved = await Promise.all(
    Object.keys(lookupTableAddresses).map(async (lookupTableAddress) => {
      const publicKey = new PublicKey(lookupTableAddress);
      const account = await connection.getAddressLookupTable(publicKey, {
        commitment: "confirmed",
      });
      const value = account.value;
      if (!value) {
        throw new RawSwapError("LOOKUP_TABLE_LOAD_FAILED", {
          message: "Could not load an address lookup table required by the route.",
        });
      }
      return value;
    }),
  );

  return resolved;
}

export async function createBuild(body: unknown, env: Env) {
  const buildStart = Date.now();
  const parsed = buildRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new RawSwapError("INVALID_REQUEST", {
      message: "Build request body is invalid.",
      details: { issues: parsed.error.flatten() },
    });
  }

  const { quoteId, userPublicKey, urgency, executionMode } = parsed.data;

  const quote = await getQuoteRecord(quoteId);
  if (!quote) throw new RawSwapError("QUOTE_NOT_FOUND");
  if (quote.expiresAt < new Date()) throw new RawSwapError("QUOTE_EXPIRED");
  if (quote.userPublicKey !== userPublicKey) throw new RawSwapError("UNEXPECTED_SIGNER");

  const profiles = getUrgencyProfiles();
  const profile = profiles[urgency];
  if (!profile) throw new RawSwapError("BUILD_FAILED");
  if (profile.internalOnly) {
    throw new RawSwapError("BUILD_FAILED", { message: `${urgency} profile is internal only` });
  }

  let providerRaw;
  try {
    providerRaw = await getBuildInstructions({
      inputMint: quote.inputMint,
      outputMint: quote.outputMint,
      amount: quote.inputAmount,
      slippageBps: quote.slippageBps,
      taker: userPublicKey,
      apiKey: env.JUPITER_API_KEY ?? "",
    });
  } catch (error) {
    throw normalizeUpstreamError(error, "BUILD_FAILED", "Jupiter", "build");
  }
  const providerParsed = jupiterBuildResponseSchema.safeParse(providerRaw);
  if (!providerParsed.success) {
    throw new RawSwapError("BUILD_FAILED", {
      message: "Route provider returned an invalid build payload.",
      details: { issues: providerParsed.error.flatten() },
    });
  }
  const jupiter = providerParsed.data as JupiterBuildResponse & Record<string, unknown>;

  const recentBlockhash = jupiter.blockhashWithMetadata?.blockhash;
  if (!recentBlockhash) {
    throw new RawSwapError("BUILD_FAILED", { message: "Jupiter build missing blockhash" });
  }

  const usesJito = executionMode !== "fallback_rpc";
  const jito = usesJito ? new JitoJsonRpcClient(env.effectiveJitoBlockEngineUrl) : null;
  const tipRecipient =
    jito && profile.jitoTipLamports > 0 ? new PublicKey(await jito.getRandomTipAccount()) : null;
  const lookupTableAccounts = await resolveLookupTableAccounts(
    new Connection(env.SOLANA_RPC_URL, "confirmed"),
    jupiter.addressesByLookupTableAddress,
  );
  const payer = new PublicKey(userPublicKey);
  const raw = jupiter as Record<string, unknown>;
  const providerAmounts = extractProviderAmounts(raw, {
    inputAmount: quote.inputAmount,
    expectedOutputAmount: quote.expectedOutputAmount,
    minimumOutputAmount: quote.minimumOutputAmount,
    priceImpactPct: quote.priceImpactPct,
  });

  const priorityFeeLamports = estimatedPriorityFeeLamports(
    profile.computeUnitPriceMicroLamports,
    DEFAULT_COMPUTE_UNIT_LIMIT,
  );
  const estimatedJitoTipLamports = usesJito ? profile.jitoTipLamports : 0;
  const riskPolicy = getRiskPolicy();
  if (priorityFeeLamports > riskPolicy.maxPriorityFeeLamports) {
    throw new RawSwapError("BUILD_FAILED", {
      message: "Priority fee exceeds configured risk policy.",
      retryable: false,
    });
  }
  if (estimatedJitoTipLamports > riskPolicy.maxJitoTipLamports) {
    throw new RawSwapError("BUILD_FAILED", {
      message: "Jito tip exceeds configured risk policy.",
      retryable: false,
    });
  }

  const maxProtocolCap = riskPolicy.maxProtocolFeeLamports ?? Number.MAX_SAFE_INTEGER;

  const feeVaultAddr = env.PROTOCOL_FEE_VAULT;
  const treasuryAddr = env.TREASURY_WALLET;
  let protocolFeeSol: ComposeOptions["protocolFeeSol"];
  let protocolFeeSplit: { buyback: bigint; treasury: bigint } | undefined;

  if (feeVaultAddr && treasuryAddr && quote.inputMint === SOL_MINT) {
    const inputLamports = parsePositiveBigInt(quote.inputAmount);
    const split = splitProtocolFeeFromInput(inputLamports);
    const totalProtocol = split.buyback + split.treasury;
    if (totalProtocol > 0n) {
      if (totalProtocol > BigInt(maxProtocolCap)) {
        throw new RawSwapError("BUILD_FAILED", {
          message: "Protocol fee exceeds configured risk policy.",
          retryable: false,
        });
      }
      let feeVault: PublicKey;
      let treasuryWallet: PublicKey;
      try {
        feeVault = new PublicKey(feeVaultAddr);
        treasuryWallet = new PublicKey(treasuryAddr);
      } catch {
        throw new RawSwapError("BUILD_FAILED", {
          message: "Invalid protocol fee vault or treasury wallet configuration.",
          retryable: false,
        });
      }
      protocolFeeSol = {
        inputAmountLamports: inputLamports,
        feeVault,
        treasuryWallet,
        buybackBps: BUYBACK_FEE_BPS,
        treasuryBps: TREASURY_FEE_BPS,
      };
      protocolFeeSplit = split;
    }
  }

  const { transaction, messageHashSha256Base64 } = composeSwapTransaction(
    jupiter as JupiterBuildResponse,
    {
      userPublicKey: payer,
      urgencyProfile: profile,
      jitoTipRecipient: tipRecipient,
      lookupTableAccounts,
      protocolFeeSol,
    },
  );

  const unsignedB64 = Buffer.from(transaction.serialize()).toString("base64");
  const fp = computeFingerprint(transaction, {
    expectedSigner: payer,
    inputMint: quote.inputMint,
    outputMint: quote.outputMint,
    minimumOutputAmount: providerAmounts.minimumOutputAmount,
    protocolFee: protocolFeeSplit,
    lookupTableAccounts,
  });

  const buildId = uuidv4();
  const expiresAt = new Date(Date.now() + 60_000);
  const lvb = jupiter.blockhashWithMetadata?.lastValidBlockHeight ?? null;
  const buildMs = Date.now() - buildStart;

  const estimatedProtocolBuybackFeeLamports = protocolFeeSplit
    ? lamportsToSafeNumber(protocolFeeSplit.buyback, "buyback")
    : null;
  const estimatedProtocolTreasuryFeeLamports = protocolFeeSplit
    ? lamportsToSafeNumber(protocolFeeSplit.treasury, "treasury")
    : null;

  await getDb().insert(transactionBuilds).values({
    id: buildId,
    quoteId,
    userPublicKey,
    unsignedTransactionBase64: unsignedB64,
    transactionMessageHash: messageHashSha256Base64,
    recentBlockhash,
    lastValidBlockHeight: lvb,
    urgency,
    executionMode,
    estimatedPriorityFeeLamports: priorityFeeLamports,
    estimatedJitoTipLamports,
    estimatedProtocolBuybackFeeLamports,
    estimatedProtocolTreasuryFeeLamports,
    expectedSigners: [userPublicKey],
    instructionProgramIds: fp.instructionProgramIds,
    lookupTableAccounts: Object.keys(jupiter.addressesByLookupTableAddress ?? {}),
    buildMetadata: {
      fingerprint: fp,
      routePlan: raw.routePlan,
      providerAmounts,
      timings: { buildMs },
    },
    expiresAt,
  });

  const venues = extractVenues(raw.routePlan);
  const storedMeta = readStoredQuoteMeta(quote.routeJson);
  const inputToken =
    storedMeta?.inputToken ?? (await getSupportedTokenByMint(quote.inputMint, env));
  const outputToken =
    storedMeta?.outputToken ?? (await getSupportedTokenByMint(quote.outputMint, env));
  if (!inputToken || !outputToken) {
    throw new RawSwapError("BUILD_FAILED", {
      message: "Token metadata was not available for the build review.",
      retryable: true,
    });
  }

  return {
    buildId,
    unsignedTransactionBase64: unsignedB64,
    transactionMessageHash: messageHashSha256Base64,
    recentBlockhash,
    lastValidBlockHeight: lvb,
    estimatedPriorityFeeLamports: priorityFeeLamports,
    computeUnitPriceMicroLamports: profile.computeUnitPriceMicroLamports,
    estimatedJitoTipLamports,
    expiresAt: expiresAt.toISOString(),
    routeSummary: {
      venues,
      hops: Array.isArray(raw.routePlan) ? raw.routePlan.length : 0,
    },
    userReview: {
      inputMint: inputToken.mint,
      outputMint: outputToken.mint,
      inputSymbol: inputToken.symbol,
      outputSymbol: outputToken.symbol,
      inputDecimals: inputToken.decimals,
      outputDecimals: outputToken.decimals,
      inputAmountUi: formatUiAmount(providerAmounts.inputAmount, inputToken.decimals),
      expectedOutputUi: formatUiAmount(providerAmounts.expectedOutputAmount, outputToken.decimals),
      minimumOutputUi: formatUiAmount(providerAmounts.minimumOutputAmount, outputToken.decimals),
      maxNetworkCostLamports: profile.maxTotalFeeLamports,
      protocolFeeApplied: Boolean(protocolFeeSplit),
      estimatedProtocolBuybackFeeLamports: estimatedProtocolBuybackFeeLamports ?? undefined,
      estimatedProtocolTreasuryFeeLamports: estimatedProtocolTreasuryFeeLamports ?? undefined,
      estimatedProtocolFeeTotalLamports:
        estimatedProtocolBuybackFeeLamports != null && estimatedProtocolTreasuryFeeLamports != null
          ? estimatedProtocolBuybackFeeLamports + estimatedProtocolTreasuryFeeLamports
          : undefined,
    },
  };
}

function extractVenues(routePlan: unknown): string[] {
  if (!Array.isArray(routePlan)) return [];
  const venues = new Set<string>();
  for (const step of routePlan as { swapInfo?: { label?: string } }[]) {
    if (step.swapInfo?.label) venues.add(step.swapInfo.label);
  }
  return [...venues];
}

export async function getBuildRecord(id: string) {
  const rows = await getDb()
    .select()
    .from(transactionBuilds)
    .where(eq(transactionBuilds.id, id))
    .limit(1);
  return rows[0] ?? null;
}
