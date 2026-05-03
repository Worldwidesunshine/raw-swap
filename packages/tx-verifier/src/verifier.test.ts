import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { Keypair, SystemProgram, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { classifyRiskFlags } from "./risk-flags.js";
import { verifySignedTransaction } from "./verifier.js";

describe("risk flags", () => {
  it("flags failed sim", () => {
    expect(classifyRiskFlags({ err: "x" }).includes("SIMULATION_FAILED")).toBe(true);
  });

  it("flags compute pressure and common routing / token-account failures from logs", () => {
    const flags = classifyRiskFlags({
      err: {
        InstructionError: [2, { Custom: 1 }],
      },
      unitsConsumed: 1_250_000,
      logs: [
        "Program log: price moved beyond limit",
        "Program log: slippage tolerance exceeded",
        "Program log: associated token account missing for owner",
        "Program log: blockhash not found",
      ],
    });

    expect(flags).toEqual(
      expect.arrayContaining([
        "SIMULATION_FAILED",
        "HIGH_COMPUTE_USAGE",
        "ROUTE_PRICE_MOVED",
        "SLIPPAGE_TOO_HIGH",
        "TOKEN_ACCOUNT_MISSING",
        "BLOCKHASH_STALE",
      ]),
    );
  });

  it("flags authority / extension / signer issues from simulation logs", () => {
    const flags = classifyRiskFlags({
      err: "unexpected program failure",
      logs: [
        "Program log: transfer hook extension is not supported",
        "Program log: permanent delegate present on mint",
        "Program log: freeze authority still enabled",
        "Program log: mint authority still enabled",
        "Program log: memo required for this transfer",
        "Program log: incorrect program id for instruction",
        "Program log: missing required signature",
        "Program log: message hash mismatch",
        "Program log: transfer fee withheld by token-2022 mint",
      ],
    });

    expect(flags).toEqual(
      expect.arrayContaining([
        "SIMULATION_FAILED",
        "TRANSFER_HOOK_PRESENT",
        "PERMANENT_DELEGATE_PRESENT",
        "FREEZE_AUTHORITY_PRESENT",
        "MINT_AUTHORITY_PRESENT",
        "MEMO_REQUIRED",
        "UNSUPPORTED_TOKEN_2022_EXTENSION",
        "UNEXPECTED_PROGRAM_ID",
        "UNEXPECTED_SIGNER",
        "MESSAGE_HASH_MISMATCH",
        "TRANSFER_TAX_DETECTED",
      ]),
    );
  });

  it("flags unsupported tokens without duplicating repeated matches", () => {
    const flags = classifyRiskFlags({
      err: "token risk checks blocked",
      logs: [
        "Program log: unsupported mint",
        "Program log: unsupported mint",
      ],
    });

    expect(flags.filter((flag) => flag === "UNKNOWN_TOKEN")).toHaveLength(1);
  });
});

function signedTransferFixture(): {
  kp: Keypair;
  signed: VersionedTransaction;
  build: {
    transactionMessageHash: string;
    userPublicKey: string;
    unsignedTransactionBase64: string;
  };
} {
  const kp = Keypair.generate();
  const messageV0 = new TransactionMessage({
    payerKey: kp.publicKey,
    recentBlockhash: "11111111111111111111111111111111",
    instructions: [
      SystemProgram.transfer({ fromPubkey: kp.publicKey, toPubkey: kp.publicKey, lamports: 0 }),
    ],
  }).compileToV0Message([]);

  const unsigned = new VersionedTransaction(messageV0);
  const signed = new VersionedTransaction(messageV0);
  signed.sign([kp]);

  const digest = createHash("sha256").update(Buffer.from(unsigned.message.serialize())).digest();
  const hashB64 = Buffer.from(digest).toString("base64");
  const build = {
    transactionMessageHash: hashB64,
    userPublicKey: kp.publicKey.toBase58(),
    unsignedTransactionBase64: Buffer.from(unsigned.serialize()).toString("base64"),
  };
  return { kp, signed, build };
}

describe("verifySignedTransaction", () => {
  it("accepts valid ed25519 signatures and rejects tampered signatures", () => {
    const { signed, build } = signedTransferFixture();

    expect(verifySignedTransaction(signed, build)).toEqual({ ok: true });

    const bad = VersionedTransaction.deserialize(Buffer.from(signed.serialize()));
    bad.signatures[0] = new Uint8Array(64).fill(7);
    const badRes = verifySignedTransaction(bad, build);
    expect(badRes.ok).toBe(false);
    if (!badRes.ok) expect(badRes.reason).toBe("BAD_SIGNATURE");
  });

  it("rejects malformed unsigned payloads", () => {
    const { signed, build } = signedTransferFixture();
    expect(verifySignedTransaction(signed, { ...build, unsignedTransactionBase64: "not-valid-base64!!!" })).toEqual({
      ok: false,
      reason: "INVALID_UNSIGNED",
    });
    expect(
      verifySignedTransaction(signed, {
        ...build,
        unsignedTransactionBase64: Buffer.from([0xff, 0xff]).toString("base64"),
      }),
    ).toEqual({ ok: false, reason: "INVALID_UNSIGNED" });
  });

  it("rejects signed message differing from embedded unsigned tx", () => {
    const { build } = signedTransferFixture();
    const other = Keypair.generate();
    const otherMsg = new TransactionMessage({
      payerKey: other.publicKey,
      recentBlockhash: "11111111111111111111111111111111",
      instructions: [
        SystemProgram.transfer({ fromPubkey: other.publicKey, toPubkey: other.publicKey, lamports: 1 }),
      ],
    }).compileToV0Message([]);
    const otherSigned = new VersionedTransaction(otherMsg);
    otherSigned.sign([other]);
    expect(verifySignedTransaction(otherSigned, build)).toEqual({ ok: false, reason: "MESSAGE_MISMATCH" });
  });

  it("rejects mismatched embedded hash", () => {
    const { signed, build } = signedTransferFixture();
    expect(
      verifySignedTransaction(signed, {
        ...build,
        transactionMessageHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa=",
      }),
    ).toEqual({ ok: false, reason: "HASH_MISMATCH" });
  });

  it("rejects wrong declared signer pubkey", () => {
    const { signed, build } = signedTransferFixture();
    expect(
      verifySignedTransaction(signed, {
        ...build,
        userPublicKey: Keypair.generate().publicKey.toBase58(),
      }),
    ).toEqual({ ok: false, reason: "SIGNER_MISMATCH" });
  });

  it("rejects missing all-zero placeholders for required signatures", () => {
    const { signed, build } = signedTransferFixture();
    const unsignedSig = VersionedTransaction.deserialize(Buffer.from(signed.serialize()));
    unsignedSig.signatures[0] = new Uint8Array(64);
    expect(verifySignedTransaction(unsignedSig, build)).toEqual({
      ok: false,
      reason: "MISSING_SIGNATURE",
    });
  });
});
