import type { ParsedTransactionMeta, ParsedTransactionWithMeta, TokenBalance } from "@solana/web3.js";

/** Native SOL mint (matches `SOL_MINT` in @rawswap/shared). */
const SOL_MINT_PARSED = "So11111111111111111111111111111111111111112";

type QuoteLike = {
  outputMint: string;
  expectedOutputAmount: string;
  userPublicKey: string;
};

export type ParsedOutput = {
  actualOutputAmount: string;
  realizedSlippageBps: number;
};

function sumTokenBalanceAmounts(
  balances: ParsedTransactionMeta["preTokenBalances"] | ParsedTransactionMeta["postTokenBalances"],
  owner: string,
  mint: string,
): bigint {
  if (!balances?.length) return 0n;

  return balances.reduce((total: bigint, balance: TokenBalance) => {
    if (balance.owner !== owner || balance.mint !== mint) {
      return total;
    }
    return total + BigInt(balance.uiTokenAmount?.amount ?? "0");
  }, 0n);
}

export function parseTransactionOutput(
  tx: ParsedTransactionWithMeta | null,
  quote: QuoteLike & {
    jitoTipLamports?: number | null;
  },
): ParsedOutput | null {
  if (!tx?.meta) return null;
  const owner = quote.userPublicKey;
  const mint = quote.outputMint;

  const preAmt = sumTokenBalanceAmounts(tx.meta.preTokenBalances, owner, mint);
  const postAmt = sumTokenBalanceAmounts(tx.meta.postTokenBalances, owner, mint);
  let delta = postAmt - preAmt;

  if (mint === SOL_MINT_PARSED && delta <= 0n && tx.meta) {
    const msg = tx.transaction.message;
    let idx = -1;
    if ("accountKeys" in msg && Array.isArray(msg.accountKeys)) {
      idx = msg.accountKeys.findIndex((k) => k.pubkey.toBase58() === owner);
    }
    if (idx >= 0) {
      const preLam = BigInt(tx.meta.preBalances[idx] ?? 0);
      const postLam = BigInt(tx.meta.postBalances[idx] ?? 0);
      delta =
        postLam -
        preLam +
        BigInt(tx.meta.fee ?? 0) +
        BigInt(quote.jitoTipLamports ?? 0);
    }
  }

  if (delta <= 0n) {
    return null;
  }

  const expected = BigInt(quote.expectedOutputAmount);
  const slippageBps = expected === 0n ? 0 : Number(((expected - delta) * 10000n) / expected);

  return {
    actualOutputAmount: delta.toString(),
    realizedSlippageBps: Math.max(0, slippageBps),
  };
}
