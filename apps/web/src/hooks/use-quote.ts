"use client";

import { useMutation } from "@tanstack/react-query";
import type { QuoteRequest } from "@rawswap/shared";
import { toast } from "sonner";
import { ApiRequestError, postQuote } from "@/lib/api-client";

export function useQuote() {
  return useMutation({
    mutationFn: (body: QuoteRequest) => postQuote(body),
    onError: (error) => {
      if (error instanceof ApiRequestError) {
        toast.error(error.message, {
          description: error.userAction ?? "Adjust the token pair or amount and retry.",
        });
        return;
      }

      toast.error(error instanceof Error ? error.message : "Quote request failed.");
    },
  });
}
