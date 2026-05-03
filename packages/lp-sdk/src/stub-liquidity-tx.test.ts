import { describe, expect, it } from "vitest";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { buildLiquidityDevStubVersionedTransaction } from "./stub-liquidity-tx.js";

describe("buildLiquidityDevStubVersionedTransaction", () => {
  it("serializes a VersionedTransaction and stable message hash", () => {
    const kp = Keypair.generate();
    const r = buildLiquidityDevStubVersionedTransaction({
      payer: kp.publicKey,
      recentBlockhash: "11111111111111111111111111111111",
    });
    expect(r.unsignedTransactionBase64.length).toBeGreaterThan(0);
    expect(r.transactionMessageHashSha256Base64.length).toBeGreaterThan(0);
    const vtx = VersionedTransaction.deserialize(Buffer.from(r.unsignedTransactionBase64, "base64"));
    expect(vtx.message.staticAccountKeys[0]?.toBase58()).toBe(kp.publicKey.toBase58());
  });
});
