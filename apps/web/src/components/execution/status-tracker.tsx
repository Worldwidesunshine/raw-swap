"use client";

import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { emoji: string; variant: "green" | "cyan" | "orange" | "pink"; label: string }> = {
  submitted: { emoji: "📡", variant: "cyan", label: "Submitted" },
  pending: { emoji: "⏳", variant: "orange", label: "Pending" },
  landed: { emoji: "✅", variant: "green", label: "Landed" },
  failed: { emoji: "❌", variant: "pink", label: "Failed" },
  unknown: { emoji: "❓", variant: "orange", label: "Unknown" },
};

export function StatusTracker({ status }: { status: unknown }) {
  if (!status || typeof status !== "object") return null;
  const s = status as Record<string, unknown>;
  const statusStr = String(s.status ?? "unknown");
  const config = STATUS_CONFIG[statusStr] ?? STATUS_CONFIG.unknown;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] animate-slide-up">
      <span className="text-lg">{config.emoji}</span>
      <div className="flex items-center gap-2 flex-1">
        <span className="text-xs font-mono text-slate-500 uppercase">Status:</span>
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>
      {statusStr === "pending" && (
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-neon-orange animate-pulse-fast"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
