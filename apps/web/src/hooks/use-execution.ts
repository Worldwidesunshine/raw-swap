"use client";

import type { BuildResponse, UserReview } from "@rawswap/shared";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { VersionedTransaction } from "@solana/web3.js";
import { useState } from "react";
import { postBuild, postSubmit } from "@/lib/api-client";
import { assertBuildTransactionSafe } from "@/lib/build-transaction-guard";
import { toast } from "sonner";
import { useWalletBootState } from "@/providers/providers";
import { useSwapStore } from "@/stores/swap-store";

function b64ToBytes(s: string) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

function bytesToB64(buf: Uint8Array) {
  let binary = "";
  buf.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

export type BuildAndSignOptions = {
  /** Called after `/api/build` succeeds, before wallet signing (for review UI). */
  onBuilt?: (userReview: UserReview) => void;
};

export function useExecution() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const walletBootState = useWalletBootState();
  const setExecution = useSwapStore((s) => s.setExecution);
  const urgency = useSwapStore((s) => s.urgency);
  const executionMode = useSwapStore((s) => s.executionMode);
  const [busy, setBusy] = useState(false);

  async function buildAndSign(quoteId: string, opts?: BuildAndSignOptions) {
    if (!publicKey || !signTransaction) {
      if (walletBootState.status === "ready") {
        setVisible(true);
        toast.error("Connect wallet first", {
          description: "Open Phantom or another supported wallet, then retry signing.",
        });
      } else if (walletBootState.status === "loading") {
        toast.error("Wallet adapters are still loading.");
      } else {
        toast.error(walletBootState.errorMessage ?? "Wallet adapters are unavailable.");
      }
      return;
    }
    setBusy(true);
    setExecution(null, null, null, null);
    try {
      const buildRes: BuildResponse = await postBuild({
        quoteId,
        userPublicKey: publicKey.toBase58(),
        urgency,
        executionMode,
      });
      opts?.onBuilt?.(buildRes.userReview);
      const vtx = VersionedTransaction.deserialize(b64ToBytes(buildRes.unsignedTransactionBase64));
      await assertBuildTransactionSafe({
        build: buildRes,
        connection,
        tx: vtx,
        walletPublicKey: publicKey,
      });
      setExecution(buildRes.buildId, null, null, buildRes.userReview);
      const signed = await signTransaction(vtx);
      const signedB64 = bytesToB64(signed.serialize());
      const submitRes = await postSubmit({
        buildId: buildRes.buildId,
        signedTransactionBase64: signedB64,
        executionMode,
        allowFallback: true,
        idempotencyKey: buildRes.buildId,
      });
      setExecution(
        buildRes.buildId,
        submitRes.executionId,
        submitRes.executionAccessToken,
        buildRes.userReview,
      );
      toast.success("Submitted");
      return submitRes;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Execution failed");
      throw e;
    } finally {
      setBusy(false);
    }
  }

  return { busy, buildAndSign };
}
