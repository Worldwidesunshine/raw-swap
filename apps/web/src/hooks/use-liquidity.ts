import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  ApiRequestError,
  formatApiRequestError,
  getLiquidityPools,
  postLiquidityDeposit,
  postLiquidityPreviewDeposit,
  postLiquidityPreviewWithdraw,
  postLiquidityWithdraw,
  type LiquidityActionBody,
} from "@/lib/api-client";
import type { LiquidityPreviewResponse } from "@rawswap/shared";

export function useLiquidityPools() {
  return useQuery({
    queryKey: ["liquidity", "pools"],
    queryFn: () => getLiquidityPools(),
    staleTime: 30_000,
  });
}

function toastForLiquidityError(error: unknown, label: string) {
  if (error instanceof ApiRequestError) {
    if (error.status === 501) {
      toast.message(`${label}: not implemented yet`, {
        description: "The API returned 501 — no action was performed on-chain.",
      });
      return;
    }
    toast.error(error.message || `${label} failed`, {
      ...(error.userAction ? { description: error.userAction } : {}),
    });
    return;
  }
  toast.error(error instanceof Error ? error.message : `${label} failed`);
}

function toastForLiquiditySuccess(_: unknown, label: string) {
  toast.success(`${label} completed`);
}

function useLiquidityMutation(
  label: string,
  mutationFn: (body: LiquidityActionBody) => Promise<unknown>,
) {
  const mutation = useMutation({
    mutationFn,
    onSuccess: (data) => toastForLiquiditySuccess(data, label),
    onError: (error) => toastForLiquidityError(error, label),
  });

  const { errorMessage, statusMessage } = useMemo(() => {
    const err = mutation.error;
    if (err instanceof ApiRequestError) {
      if (err.status === 501) {
        return {
          errorMessage: null as string | null,
          statusMessage: "API returned 501 (not implemented) — check the toast for details.",
        };
      }
      return {
        errorMessage: formatApiRequestError(err),
        statusMessage: null as string | null,
      };
    }
    if (err) {
      return {
        errorMessage: err instanceof Error ? err.message : "Request failed",
        statusMessage: null as string | null,
      };
    }
    if (mutation.isSuccess) {
      return { errorMessage: null as string | null, statusMessage: "Request succeeded." };
    }
    return { errorMessage: null as string | null, statusMessage: null as string | null };
  }, [mutation.error, mutation.isSuccess]);

  const mutate = useCallback(
    (body: LiquidityActionBody) => {
      mutation.mutate(body);
    },
    [mutation],
  );

  return {
    mutate,
    reset: mutation.reset,
    isPending: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    errorMessage,
    statusMessage,
  };
}

export function useLiquidityDeposit() {
  return useLiquidityMutation("Deposit", postLiquidityDeposit);
}

export function useLiquidityWithdraw() {
  return useLiquidityMutation("Withdraw", postLiquidityWithdraw);
}

export function useLiquidityPreviewDeposit() {
  return useMutation({
    mutationFn: postLiquidityPreviewDeposit,
    onSuccess: (data: LiquidityPreviewResponse) => {
      toast.message("SDK next step (deposit)", {
        description: data.sdkNextStep,
        duration: 12_000,
      });
    },
    onError: (error) => toastForLiquidityError(error, "Preview deposit"),
  });
}

export function useLiquidityPreviewWithdraw() {
  return useMutation({
    mutationFn: postLiquidityPreviewWithdraw,
    onSuccess: (data: LiquidityPreviewResponse) => {
      toast.message("SDK next step (withdraw)", {
        description: data.sdkNextStep,
        duration: 12_000,
      });
    },
    onError: (error) => toastForLiquidityError(error, "Preview withdraw"),
  });
}
