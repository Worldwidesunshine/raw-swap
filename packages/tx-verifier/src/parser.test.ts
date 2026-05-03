import { describe, expect, it } from "vitest";
import { PublicKey } from "@solana/web3.js";
import { parseTransactionOutput } from "./parser.js";
import { SOL_MINT } from "@rawswap/shared";

describe("parser", () => {
  it("returns null without meta", () => {
    expect(
      parseTransactionOutput(null, {
        outputMint: "",
        expectedOutputAmount: "1",
        userPublicKey: "",
      }),
    ).toBeNull();
  });

  it("adds fees and Jito tip back when inferring native SOL output", () => {
    const owner = PublicKey.unique();
    const parsed = parseTransactionOutput(
      {
        meta: {
          fee: 5_000,
          preBalances: [1_000_000],
          postBalances: [1_095_000],
          preTokenBalances: [],
          postTokenBalances: [],
        },
        transaction: {
          message: {
            accountKeys: [{ pubkey: owner }],
          },
        },
      } as never,
      {
        outputMint: SOL_MINT,
        expectedOutputAmount: "110000",
        userPublicKey: owner.toBase58(),
        jitoTipLamports: 10_000,
      },
    );

    expect(parsed).toEqual({
      actualOutputAmount: "110000",
      realizedSlippageBps: 0,
    });
  });

  it("returns null when token delta is non-positive", () => {
    const owner = PublicKey.unique();
    expect(
      parseTransactionOutput(
        {
          meta: {
            fee: 0,
            preBalances: [],
            postBalances: [],
            preTokenBalances: [
              {
                mint: "TokenMint111",
                owner: owner.toBase58(),
                uiTokenAmount: { amount: "500" },
              },
            ],
            postTokenBalances: [
              {
                mint: "TokenMint111",
                owner: owner.toBase58(),
                uiTokenAmount: { amount: "500" },
              },
            ],
          },
          transaction: { message: {} },
        } as never,
        {
          outputMint: "TokenMint111",
          expectedOutputAmount: "1",
          userPublicKey: owner.toBase58(),
        },
      ),
    ).toBeNull();

    expect(
      parseTransactionOutput(
        {
          meta: {
            fee: 0,
            preBalances: [],
            postBalances: [],
            preTokenBalances: [
              {
                mint: "TokenMint222",
                owner: owner.toBase58(),
                uiTokenAmount: { amount: "100" },
              },
            ],
            postTokenBalances: [
              {
                mint: "TokenMint222",
                owner: owner.toBase58(),
                uiTokenAmount: { amount: "50" },
              },
            ],
          },
          transaction: { message: {} },
        } as never,
        {
          outputMint: "TokenMint222",
          expectedOutputAmount: "1",
          userPublicKey: owner.toBase58(),
        },
      ),
    ).toBeNull();
  });

  it("aggregates output across multiple token accounts for the same owner and mint", () => {
    const owner = PublicKey.unique();
    expect(
      parseTransactionOutput(
        {
          meta: {
            fee: 0,
            preBalances: [],
            postBalances: [],
            preTokenBalances: [
              {
                accountIndex: 1,
                mint: "TokenMint333",
                owner: owner.toBase58(),
                uiTokenAmount: { amount: "100" },
              },
              {
                accountIndex: 2,
                mint: "TokenMint333",
                owner: owner.toBase58(),
                uiTokenAmount: { amount: "50" },
              },
            ],
            postTokenBalances: [
              {
                accountIndex: 1,
                mint: "TokenMint333",
                owner: owner.toBase58(),
                uiTokenAmount: { amount: "175" },
              },
              {
                accountIndex: 2,
                mint: "TokenMint333",
                owner: owner.toBase58(),
                uiTokenAmount: { amount: "75" },
              },
            ],
          },
          transaction: { message: {} },
        } as never,
        {
          outputMint: "TokenMint333",
          expectedOutputAmount: "100",
          userPublicKey: owner.toBase58(),
        },
      ),
    ).toEqual({
      actualOutputAmount: "100",
      realizedSlippageBps: 0,
    });
  });

  it("returns null for invalid / unusable payloads (missing meta account resolution)", () => {
    expect(
      parseTransactionOutput({} as never, {
        outputMint: "m",
        expectedOutputAmount: "1",
        userPublicKey: "x".repeat(44),
      }),
    ).toBeNull();

    expect(
      parseTransactionOutput(
        {
          meta: {
            fee: 0,
            preBalances: [0],
            postBalances: [0],
            preTokenBalances: [],
            postTokenBalances: [],
          },
          transaction: { message: {} },
        } as never,
        {
          outputMint: SOL_MINT,
          expectedOutputAmount: "100",
          userPublicKey: PublicKey.unique().toBase58(),
        },
      ),
    ).toBeNull();
  });

  it("uses zero slippage bps when expected output is zero (avoids divide-by-zero)", () => {
    const owner = PublicKey.unique();
    expect(
      parseTransactionOutput(
        {
          meta: {
            fee: 0,
            preBalances: [],
            postBalances: [],
            preTokenBalances: [],
            postTokenBalances: [
              {
                mint: "MintX",
                owner: owner.toBase58(),
                uiTokenAmount: { amount: "7" },
              },
            ],
          },
          transaction: { message: {} },
        } as never,
        {
          outputMint: "MintX",
          expectedOutputAmount: "0",
          userPublicKey: owner.toBase58(),
        },
      ),
    ).toEqual({
      actualOutputAmount: "7",
      realizedSlippageBps: 0,
    });
  });
});
