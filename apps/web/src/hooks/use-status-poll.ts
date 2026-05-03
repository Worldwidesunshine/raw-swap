"use client";

import { useQuery } from "@tanstack/react-query";
import { getReport, getStatus } from "@/lib/api-client";

export function useStatusPoll(executionId: string | null, executionAccessToken: string | null) {
  return useQuery({
    queryKey: ["status", executionId, executionAccessToken],
    enabled: !!executionId && !!executionAccessToken,
    refetchInterval: 1000,
    queryFn: () => getStatus(executionId!, executionAccessToken!),
  });
}

type ExecutionStatusPayload = { status?: string };

export function useReport(
  executionId: string | null,
  executionAccessToken: string | null,
  executionStatus?: ExecutionStatusPayload | null,
) {
  return useQuery({
    queryKey: ["report", executionId, executionAccessToken],
    enabled: !!executionId && !!executionAccessToken,
    queryFn: () => getReport(executionId!, executionAccessToken!),
    refetchInterval: (query) => {
      const st =
        executionStatus?.status ??
        (query.state.data as ExecutionStatusPayload | undefined)?.status;
      if (st === "landed" || st === "failed" || st === "unknown") {
        return false;
      }
      return 2000;
    },
  });
}
