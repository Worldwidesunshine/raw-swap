"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { SwapToken } from "@rawswap/shared";
import type { QuoteResponse } from "@rawswap/shared";
import { tokenFallbackLabel } from "@/lib/tokens";

function msUntilExpiry(expiresAt: string): number | null {
  const expiresAtMs = Date.parse(expiresAt);
  if (Number.isNaN(expiresAtMs)) return null;
  return Math.max(expiresAtMs - Date.now(), 0);
}

function formatCountdown(msRemaining: number): string {
  const totalSeconds = Math.ceil(msRemaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function QuotePreview({ quote }: { quote: QuoteResponse | null }) {
  const [timeRemainingMs, setTimeRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (!quote) {
      setTimeRemainingMs(null);
      return;
    }

    const refresh = () => {
      setTimeRemainingMs(msUntilExpiry(quote.expiresAt));
    };

    refresh();
    const timer = window.setInterval(refresh, 1000);
    return () => window.clearInterval(timer);
  }, [quote]);

  if (!quote) return null;
  const route = quote.routeSummary;
  const outputToken = quote.outputToken as SwapToken | undefined;
  const outLabel = outputToken ? tokenFallbackLabel(outputToken) : "";
  const outAmount = quote.outAmountUi;
  const minOutAmount = quote.minimumOutAmountUi;
  const isExpired = timeRemainingMs === 0;
  const isExpiringSoon = (timeRemainingMs ?? Number.POSITIVE_INFINITY) <= 15_000;
  const expiryLabel =
    timeRemainingMs === null ? "Timer unavailable" : isExpired ? "Quote expired" : formatCountdown(timeRemainingMs);
  const expiryVariant = isExpired ? "pink" : isExpiringSoon ? "orange" : "green";

  return (
    <div className="space-y-3 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-neon-green pulse-dot" />
        <span className="text-xs font-mono font-bold text-neon-green uppercase tracking-widest">
          Quote Ready
        </span>
        <Badge variant={expiryVariant} className="ml-auto">
          {isExpired ? "Expired" : `Expires ${expiryLabel}`}
        </Badge>
      </div>

      <div
        className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
          isExpired
            ? "bg-neon-pink/[0.05] border-neon-pink/20"
            : isExpiringSoon
              ? "bg-neon-orange/[0.05] border-neon-orange/20"
              : "bg-white/[0.02] border-white/[0.04]"
        }`}
      >
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          Quote Window
        </span>
        <span
          className={`text-xs font-mono font-bold ${
            isExpired
              ? "text-neon-pink"
              : isExpiringSoon
                ? "text-neon-orange"
                : "text-white"
          }`}
        >
          {expiryLabel}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid gap-2">
        <QuoteRow label="Output" value={`${outAmount} ${outLabel}`.trim()} variant="green" />
        <QuoteRow label="Min Out" value={`${minOutAmount} ${outLabel}`.trim()} variant="cyan" />
        <QuoteRow
          label="Impact"
          value={`${String(quote.priceImpactPct ?? "")}%`}
          variant={Number(quote.priceImpactPct) > 1 ? "pink" : "green"}
        />
      </div>

      {/* Route */}
      {route && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          <span className="text-[10px] font-mono text-slate-600 uppercase">Route:</span>
          <span className="text-[11px] font-mono text-slate-400">
            {route.venues.join(" → ") || "—"}
          </span>
          <Badge variant="purple" className="ml-auto">
            {route.hops} hop{route.hops !== 1 ? "s" : ""}
          </Badge>
        </div>
      )}
    </div>
  );
}

function QuoteRow({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: "green" | "cyan" | "pink";
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
      <Badge variant={variant}>{label}</Badge>
      <span className="text-sm font-mono font-bold text-white">{value}</span>
    </div>
  );
}
