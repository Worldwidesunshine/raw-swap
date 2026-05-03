import { createHash } from "node:crypto";
import {
  AddressLookupTableAccount,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { lookupTablesFromJupiterMap } from "./alt-resolver.js";
import { setComputeUnitLimit, setComputeUnitPrice } from "./compute-budget.js";
import { withDontFront } from "./dontfront.js";
import {
  type JupiterIxJson,
  instructionFromJupiterJson,
  instructionsFromJupiterJson,
} from "./instruction-builder.js";
import { transferSolTipIx } from "./jito-tip.js";
import { protocolFeeSolTransfers } from "./protocol-fee.js";

export type JupiterBuildResponse = {
  computeBudgetInstructions?: JupiterIxJson[];
  setupInstructions?: JupiterIxJson[];
  swapInstruction: JupiterIxJson;
  cleanupInstruction?: JupiterIxJson | null;
  otherInstructions?: JupiterIxJson[];
  addressesByLookupTableAddress?: Record<string, string[]>;
  blockhashWithMetadata?: { blockhash: string; lastValidBlockHeight: number };
};

export type UrgencyProfileNumbers = {
  computeUnitPriceMicroLamports: number;
  jitoTipLamports: number;
  maxTotalFeeLamports: number;
};

export type ComposeOptions = {
  userPublicKey: PublicKey;
  urgencyProfile: UrgencyProfileNumbers;
  jitoTipRecipient?: PublicKey | null;
  lookupTableAccounts?: AddressLookupTableAccount[];
  /** Default conservative limit; tune via simulation */
  computeUnitLimit?: number;
  /**
   * When input is native SOL (or wSOL treated as lamports), protocol fee transfers
   * are appended after route cleanup and before the Jito tip.
   */
  protocolFeeSol?: {
    inputAmountLamports: bigint;
    feeVault: PublicKey;
    treasuryWallet: PublicKey;
    buybackBps: number;
    treasuryBps: number;
  };
};

export function composeSwapTransaction(
  build: JupiterBuildResponse,
  opts: ComposeOptions,
): { transaction: VersionedTransaction; messageHashSha256Base64: string } {
  const bh = build.blockhashWithMetadata?.blockhash;
  if (!bh) throw new Error("Missing blockhashWithMetadata from Jupiter build response");

  const lookupTables =
    opts.lookupTableAccounts ??
    lookupTablesFromJupiterMap(build.addressesByLookupTableAddress);
  const limit = opts.computeUnitLimit ?? 1_400_000;

  /** Jupiter route-specific compute budget (heap, loaded accounts, etc.); our limit/price follow so they win on-chain. */
  const jupiterComputeBudget = instructionsFromJupiterJson(build.computeBudgetInstructions);

  const cuLimitIx = setComputeUnitLimit(limit);
  const ourCuPriceIx = [
    setComputeUnitPrice(opts.urgencyProfile.computeUnitPriceMicroLamports),
  ];

  const setup = instructionsFromJupiterJson(build.setupInstructions);
  const swap = withDontFront(instructionFromJupiterJson(build.swapInstruction));
  const other = instructionsFromJupiterJson(build.otherInstructions);
  const cleanup = build.cleanupInstruction
    ? [instructionFromJupiterJson(build.cleanupInstruction)]
    : [];

  const instructions = [
    ...jupiterComputeBudget,
    cuLimitIx,
    ...ourCuPriceIx,
    ...setup,
    swap,
    ...other,
    ...cleanup,
  ];
  if (opts.protocolFeeSol) {
    instructions.push(
      ...protocolFeeSolTransfers({
        payer: opts.userPublicKey,
        ...opts.protocolFeeSol,
      }),
    );
  }
  if (opts.jitoTipRecipient && opts.urgencyProfile.jitoTipLamports > 0) {
    instructions.push(
      transferSolTipIx(
        opts.userPublicKey,
        opts.jitoTipRecipient,
        opts.urgencyProfile.jitoTipLamports,
      ),
    );
  }

  const messageV0 = new TransactionMessage({
    payerKey: opts.userPublicKey,
    recentBlockhash: bh,
    instructions,
  }).compileToV0Message(lookupTables);

  const tx = new VersionedTransaction(messageV0);
  const digest = createHash("sha256").update(Buffer.from(tx.message.serialize())).digest();
  return { transaction: tx, messageHashSha256Base64: Buffer.from(digest).toString("base64") };
}

export { type JupiterIxJson } from "./instruction-builder.js";
