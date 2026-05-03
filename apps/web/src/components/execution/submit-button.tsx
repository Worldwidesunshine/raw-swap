"use client";

import type { UserReview } from "@rawswap/shared";
import { Button } from "@/components/ui/button";
import { useExecution } from "@/hooks/use-execution";
import { useSwapStore } from "@/stores/swap-store";
import { useState } from "react";
import { SigningDialog } from "./signing-dialog";

export function SubmitButton() {
  const quoteId = useSwapStore((s) => s.quoteId);
  const { busy, buildAndSign } = useExecution();
  const [dialog, setDialog] = useState(false);
  const [review, setReview] = useState<UserReview | null>(null);

  if (!quoteId) return null;

  return (
    <div className="animate-slide-up">
      <Button
        variant="fire"
        className="w-full h-12 text-sm relative overflow-hidden group"
        disabled={busy}
        onClick={async () => {
          setReview(null);
          setDialog(false);
          try {
            await buildAndSign(quoteId, {
              onBuilt: (userReview) => {
                setReview(userReview);
                setDialog(true);
              },
            });
          } finally {
            setDialog(false);
          }
        }}
      >
        {/* Animated shimmer */}
        {!busy && (
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        )}

        {busy ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Signing & Submitting…
          </span>
        ) : (
          "💀 Sign & Send It"
        )}
      </Button>
      <SigningDialog open={dialog} summary={review} onClose={() => setDialog(false)} />
    </div>
  );
}
