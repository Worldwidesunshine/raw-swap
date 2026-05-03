"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ApiRequestError, getTokenByMint } from "@/lib/api-client";
import { isUiAmountInput, looksLikeMintAddress } from "@/lib/tokens";
import { useSwapStore } from "@/stores/swap-store";

export function PairHydrator() {
  const searchParams = useSearchParams();
  const setInputToken = useSwapStore((state) => state.setInputToken);
  const setOutputToken = useSwapStore((state) => state.setOutputToken);
  const setField = useSwapStore((state) => state.setField);
  const appliedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const inputMint = searchParams.get("inputMint")?.trim() ?? "";
    const outputMint = searchParams.get("outputMint")?.trim() ?? "";
    const amount = searchParams.get("amount")?.trim() ?? "";
    const hydrationKey = JSON.stringify({ inputMint, outputMint, amount });

    if (hydrationKey === appliedKeyRef.current) return;
    appliedKeyRef.current = hydrationKey;

    if (!inputMint && !outputMint && !amount) return;

    let cancelled = false;

    async function hydrateFromUrl() {
      const sideLoaders = await Promise.allSettled([
        inputMint
          ? loadTokenFromMint("input", inputMint)
          : Promise.resolve<{ side: "input"; token: null }>({ side: "input", token: null }),
        outputMint
          ? loadTokenFromMint("output", outputMint)
          : Promise.resolve<{ side: "output"; token: null }>({ side: "output", token: null }),
      ]);
      if (cancelled) return;

      for (const result of sideLoaders) {
        if (result.status === "rejected") {
          const error = result.reason;
          if (error instanceof ApiRequestError) {
            toast.error(error.message, {
              description: error.userAction ?? "Check the token mint and retry.",
            });
          } else {
            toast.error("Could not hydrate token pair from the URL.");
          }
          continue;
        }

        const { side, token } = result.value;
        if (!token) continue;
        if (side === "input") {
          setInputToken(token);
        } else {
          setOutputToken(token);
        }
      }

      if (!amount) return;
      if (isUiAmountInput(amount)) {
        setField("amount", amount);
      } else {
        toast.error("Ignored invalid amount from the URL.", {
          description: "Use a plain token amount like 1 or 12.5.",
        });
      }
    }

    void hydrateFromUrl();

    return () => {
      cancelled = true;
    };
  }, [searchParams, setField, setInputToken, setOutputToken]);

  return null;
}

async function loadTokenFromMint(side: "input" | "output", mint: string) {
  if (!looksLikeMintAddress(mint)) {
    throw new ApiRequestError(`Ignored invalid ${side} mint from the URL.`, {
      code: "INVALID_MINT_PARAM",
      status: 400,
      userAction: "Use a full Solana mint address in the query string.",
    });
  }

  return {
    side,
    token: await getTokenByMint(mint),
  };
}
