import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import { buildCreateTxUrl } from "@rawswap/cross-chain";
import {
  ApiRequestError,
  getCrossChainTransfers,
  patchCrossChainTransfer,
  postCrossChainTransfer,
  type CrossChainTransferCreateInput,
} from "@/lib/api-client";

/**
 * Bridge / DLN helpers (Waves 14–15). Full flow: quote → create-tx → sign → poll order state.
 */
export function useBridgeHelpers() {
  return useMemo(
    () => ({
      sampleCreateTxUrl(account: string) {
        return buildCreateTxUrl({
          account,
          /** API params filled per deBridge docs */
        });
      },
    }),
    [],
  );
}

export function useRecentCrossChainTransfers(opts: {
  limit?: number;
  wallet?: string;
  walletSessionToken?: string | null;
}) {
  return useQuery({
    queryKey: ["cross-chain", "transfers", opts.limit ?? 20, opts.wallet ?? ""],
    enabled: !!opts.wallet && !!opts.walletSessionToken,
    queryFn: () =>
      getCrossChainTransfers(
        { limit: opts.limit ?? 20, wallet: opts.wallet },
        opts.walletSessionToken!,
      ),
    staleTime: 15_000,
  });
}

export function useRecordCrossChainTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { body: CrossChainTransferCreateInput; walletSessionToken: string }) =>
      postCrossChainTransfer(args.body, args.walletSessionToken),
    onSuccess: (row) => {
      toast.success("Recorded transfer", { description: row.id });
      void qc.invalidateQueries({ queryKey: ["cross-chain", "transfers"] });
    },
    onError: (err) => {
      if (err instanceof ApiRequestError) {
        if (err.status === 501) {
          toast.message("Record transfer: not implemented yet", {
            description: "The API returned 501 — no row was stored.",
          });
          return;
        }
        toast.error(err.message || "Failed to record", {
          ...(err.userAction ? { description: err.userAction } : {}),
        });
        return;
      }
      toast.error(err instanceof Error ? err.message : "Failed to record");
    },
  });
}

export function usePatchCrossChainTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      id: string;
      body: { status: string; metadata?: Record<string, unknown> };
      walletSessionToken: string;
    }) => patchCrossChainTransfer(args.id, args.body, args.walletSessionToken),
    onSuccess: (row) => {
      toast.success("Updated transfer", { description: `${row.id} → ${row.status}` });
      void qc.invalidateQueries({ queryKey: ["cross-chain", "transfers"] });
    },
    onError: (err) => {
      if (err instanceof ApiRequestError) {
        if (err.status === 501) {
          toast.message("Update transfer: not implemented yet", {
            description: "The API returned 501 — status was not updated.",
          });
          return;
        }
        toast.error(err.message || "Patch failed", {
          ...(err.userAction ? { description: err.userAction } : {}),
        });
        return;
      }
      toast.error(err instanceof Error ? err.message : "Patch failed");
    },
  });
}
