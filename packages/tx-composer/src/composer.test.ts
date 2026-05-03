import { describe, expect, it } from "vitest";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { composeSwapTransaction, type JupiterBuildResponse } from "./composer.js";

function minimalBuild(overrides: Partial<JupiterBuildResponse> = {}): JupiterBuildResponse {
  return {
    blockhashWithMetadata: {
      blockhash: "11111111111111111111111111111111",
      lastValidBlockHeight: 1,
    },
    swapInstruction: {
      programId: "11111111111111111111111111111111",
      accounts: [],
      data: "",
    },
    ...overrides,
  };
}

describe("composeSwapTransaction", () => {
  it("throws without blockhash", () => {
    const build: JupiterBuildResponse = {
      swapInstruction: {
        programId: "11111111111111111111111111111111",
        accounts: [],
        data: "",
      },
    };
    expect(() =>
      composeSwapTransaction(build, {
        userPublicKey: PublicKey.unique(),
        urgencyProfile: {
          computeUnitPriceMicroLamports: 1,
          jitoTipLamports: 1000,
          maxTotalFeeLamports: 10000,
        },
        jitoTipRecipient: PublicKey.unique(),
      }),
    ).toThrow(/blockhash/);
  });

  it("omits the Jito tip instruction when no tip recipient is provided", () => {
    const build = minimalBuild();
    const payer = PublicKey.unique();
    const withTip = composeSwapTransaction(build, {
      userPublicKey: payer,
      urgencyProfile: {
        computeUnitPriceMicroLamports: 1,
        jitoTipLamports: 1000,
        maxTotalFeeLamports: 10000,
      },
      jitoTipRecipient: PublicKey.unique(),
    });
    const withoutTip = composeSwapTransaction(build, {
      userPublicKey: payer,
      urgencyProfile: {
        computeUnitPriceMicroLamports: 1,
        jitoTipLamports: 1000,
        maxTotalFeeLamports: 10000,
      },
    });

    expect(withTip.transaction.message.compiledInstructions).toHaveLength(
      withoutTip.transaction.message.compiledInstructions.length + 1,
    );
  });

  it("omits the Jito tip when lamports are zero even if recipient is set", () => {
    const build = minimalBuild();
    const payer = PublicKey.unique();
    const tipRecipient = PublicKey.unique();
    const withZeroTip = composeSwapTransaction(build, {
      userPublicKey: payer,
      urgencyProfile: {
        computeUnitPriceMicroLamports: 1,
        jitoTipLamports: 0,
        maxTotalFeeLamports: 10000,
      },
      jitoTipRecipient: tipRecipient,
    });
    const baseline = composeSwapTransaction(build, {
      userPublicKey: payer,
      urgencyProfile: {
        computeUnitPriceMicroLamports: 1,
        jitoTipLamports: 0,
        maxTotalFeeLamports: 10000,
      },
    });
    expect(withZeroTip.transaction.message.compiledInstructions.length).toBe(
      baseline.transaction.message.compiledInstructions.length,
    );
  });

  it("does not append protocol fee instructions when both BPS are zero", () => {
    const build = minimalBuild();
    const payer = PublicKey.unique();
    const baseline = composeSwapTransaction(build, {
      userPublicKey: payer,
      urgencyProfile: {
        computeUnitPriceMicroLamports: 1,
        jitoTipLamports: 0,
        maxTotalFeeLamports: 10000,
      },
    });
    const withZeroFee = composeSwapTransaction(build, {
      userPublicKey: payer,
      urgencyProfile: {
        computeUnitPriceMicroLamports: 1,
        jitoTipLamports: 0,
        maxTotalFeeLamports: 10000,
      },
      protocolFeeSol: {
        inputAmountLamports: 1_000_000n,
        feeVault: payer,
        treasuryWallet: payer,
        buybackBps: 0,
        treasuryBps: 0,
      },
    });
    expect(withZeroFee.transaction.message.compiledInstructions.length).toBe(
      baseline.transaction.message.compiledInstructions.length,
    );
  });

  it("adds two SystemProgram transfer instructions when protocolFeeSol is set", () => {
    const build = minimalBuild();
    const payer = PublicKey.unique();
    const withoutFee = composeSwapTransaction(build, {
      userPublicKey: payer,
      urgencyProfile: {
        computeUnitPriceMicroLamports: 1,
        jitoTipLamports: 0,
        maxTotalFeeLamports: 10000,
      },
    });
    const withFee = composeSwapTransaction(build, {
      userPublicKey: payer,
      urgencyProfile: {
        computeUnitPriceMicroLamports: 1,
        jitoTipLamports: 0,
        maxTotalFeeLamports: 10000,
      },
      protocolFeeSol: {
        inputAmountLamports: 1_000_000_000n,
        feeVault: PublicKey.unique(),
        treasuryWallet: PublicKey.unique(),
        buybackBps: 12,
        treasuryBps: 4,
      },
    });

    expect(withFee.transaction.message.compiledInstructions.length).toBe(
      withoutFee.transaction.message.compiledInstructions.length + 2,
    );
  });

  it("places protocol fee transfers immediately before the Jito tip", () => {
    const build = minimalBuild();
    const payer = PublicKey.unique();
    const tipRecipient = PublicKey.unique();
    const vault = PublicKey.unique();
    const treasury = PublicKey.unique();

    const tx = composeSwapTransaction(build, {
      userPublicKey: payer,
      urgencyProfile: {
        computeUnitPriceMicroLamports: 1,
        jitoTipLamports: 42,
        maxTotalFeeLamports: 10000,
      },
      jitoTipRecipient: tipRecipient,
      protocolFeeSol: {
        inputAmountLamports: 10_000_000n,
        feeVault: vault,
        treasuryWallet: treasury,
        buybackBps: 50,
        treasuryBps: 50,
      },
    });

    const message = tx.transaction.message;
    const ixs = message.compiledInstructions;
    const keys = message.getAccountKeys();
    const last = ixs[ixs.length - 1];
    const programId = keys.get(last.programIdIndex);
    expect(programId.equals(SystemProgram.programId)).toBe(true);
    const tipTo = keys.get(last.accountKeyIndexes[1]);
    expect(tipTo?.equals(tipRecipient)).toBe(true);

    const secondLast = ixs[ixs.length - 2];
    expect(keys.get(secondLast.programIdIndex)?.equals(SystemProgram.programId)).toBe(true);
    const treasuryTo = keys.get(secondLast.accountKeyIndexes[1]);
    expect(treasuryTo?.equals(treasury)).toBe(true);

    const thirdLast = ixs[ixs.length - 3];
    expect(keys.get(thirdLast.programIdIndex)?.equals(SystemProgram.programId)).toBe(true);
    const vaultTo = keys.get(thirdLast.accountKeyIndexes[1]);
    expect(vaultTo?.equals(vault)).toBe(true);
  });
});
