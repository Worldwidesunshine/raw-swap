import { describe, expect, it } from "vitest";
import { Keypair, SystemProgram, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { computeFingerprint, computeMessageHashBase64FromTx } from "./fingerprint.js";

function minimalV0TransferTx(): { tx: VersionedTransaction; payer: Keypair } {
  const payer = Keypair.generate();
  const messageV0 = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: "11111111111111111111111111111111",
    instructions: [
      SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: payer.publicKey, lamports: 0 }),
      SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: payer.publicKey, lamports: 0 }),
    ],
  }).compileToV0Message([]);
  return { tx: new VersionedTransaction(messageV0), payer };
}

describe("fingerprint", () => {
  it("computes deterministic message hashes for the same canonical bytes", () => {
    const { tx } = minimalV0TransferTx();
    const h1 = computeMessageHashBase64FromTx(tx);
    const roundTrip = VersionedTransaction.deserialize(Buffer.from(tx.serialize()));
    const h2 = computeMessageHashBase64FromTx(roundTrip);
    expect(h1).toBe(h2);
    expect(Buffer.from(h1, "base64")).toHaveLength(32);
  });

  it("dedupes repeated instruction program IDs (stable canonical list)", () => {
    const { tx, payer } = minimalV0TransferTx();
    const fp = computeFingerprint(tx, {
      expectedSigner: payer.publicKey,
      inputMint: "MintA",
      outputMint: "MintB",
      minimumOutputAmount: "42",
    });
    expect(fp.instructionProgramIds).toEqual([SystemProgram.programId.toBase58()]);
  });

  it("omits protocolFee when absent or both limbs are zero", () => {
    const { tx, payer } = minimalV0TransferTx();
    const base = {
      expectedSigner: payer.publicKey,
      inputMint: "i",
      outputMint: "o",
      minimumOutputAmount: "1",
    };
    expect(computeFingerprint(tx, base).protocolFee).toBeUndefined();
    expect(
      computeFingerprint(tx, {
        ...base,
        protocolFee: { buyback: 0n, treasury: 0n },
      }).protocolFee,
    ).toBeUndefined();
  });

  it("includes protocolFee when buyback or treasury is positive", () => {
    const { tx, payer } = minimalV0TransferTx();
    const meta = {
      expectedSigner: payer.publicKey,
      inputMint: "i",
      outputMint: "o",
      minimumOutputAmount: "1",
    };
    expect(
      computeFingerprint(tx, {
        ...meta,
        protocolFee: { buyback: 1_000n, treasury: 0n },
      }).protocolFee,
    ).toEqual({
      buybackLamports: "1000",
      treasuryLamports: "0",
      totalLamports: "1000",
    });
    expect(
      computeFingerprint(tx, {
        ...meta,
        protocolFee: { buyback: 0n, treasury: 2n },
      }).protocolFee,
    ).toEqual({
      buybackLamports: "0",
      treasuryLamports: "2",
      totalLamports: "2",
    });
    expect(
      computeFingerprint(tx, {
        ...meta,
        protocolFee: { buyback: 3n, treasury: 4n },
      }).protocolFee,
    ).toEqual({
      buybackLamports: "3",
      treasuryLamports: "4",
      totalLamports: "7",
    });
  });

  it("classifies static accounts into writable vs readonly consistently with the message header", () => {
    const { tx, payer } = minimalV0TransferTx();
    const fp = computeFingerprint(tx, {
      expectedSigner: payer.publicKey,
      inputMint: "i",
      outputMint: "o",
      minimumOutputAmount: "0",
    });
    expect(fp.writableAccounts).toContain(payer.publicKey.toBase58());
    expect(fp.readonlyAccounts).toContain(SystemProgram.programId.toBase58());
    expect(new Set([...fp.writableAccounts, ...fp.readonlyAccounts]).size).toBe(
      tx.message.staticAccountKeys.length,
    );
  });
});
