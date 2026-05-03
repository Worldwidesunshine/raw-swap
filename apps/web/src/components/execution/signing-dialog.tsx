"use client";

import type { UserReview } from "@rawswap/shared";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";

export function SigningDialog({
  open,
  summary,
  onClose,
}: {
  open: boolean;
  summary: UserReview | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔐</span>
          <p className="font-mono font-bold text-neon-green uppercase tracking-wider text-sm">
            Review Swap
          </p>
        </div>
        {summary ? (
          <div className="space-y-3 rounded-xl border border-white/[0.04] bg-void-100 p-4">
            <ReviewRow
              label="Input"
              value={`${summary.inputAmountUi} ${summary.inputSymbol}`}
              badge={summary.inputSymbol}
            />
            <ReviewRow
              label="Expected Out"
              value={`${summary.expectedOutputUi} ${summary.outputSymbol}`}
              badge={summary.outputSymbol}
            />
            <ReviewRow
              label="Minimum Out"
              value={`${summary.minimumOutputUi} ${summary.outputSymbol}`}
              badge="slippage"
            />
            <ReviewRow
              label="Network Ceiling"
              value={`${summary.maxNetworkCostLamports} lamports`}
              badge="fees"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.04] bg-void-100 p-4 text-xs font-mono text-slate-500">
            Waiting for build summary…
          </div>
        )}
        <p className="text-[10px] font-mono text-slate-600 text-center uppercase tracking-widest">
          Your wallet will prompt for signature
        </p>
      </div>
    </Dialog>
  );
}

function ReviewRow({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Badge variant="cyan">{label}</Badge>
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-600">
          {badge}
        </span>
      </div>
      <span className="text-sm font-mono font-bold text-white">{value}</span>
    </div>
  );
}
