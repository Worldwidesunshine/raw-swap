"use client";

import { useQuery } from "@tanstack/react-query";
import { useDeferredValue } from "react";
import { getTokens } from "@/lib/api-client";

export function useTokenSearch(query: string, limit = 20) {
  const deferredQuery = useDeferredValue(query.trim());

  return useQuery({
    queryKey: ["tokens", deferredQuery, limit],
    queryFn: () => getTokens(deferredQuery, limit),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
