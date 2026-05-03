"use client";

export function FeeSummary({ report }: { report: Record<string, unknown> | null }) {
  if (!report) return null;
  return (
    <div className="grid grid-cols-2 gap-2 animate-slide-up">
      <FeeMetric
        icon="⛽"
        label="Priority Fee"
        value={String(report.priorityFeeLamports ?? "—")}
        unit="lamports"
      />
      <FeeMetric
        icon="🛡️"
        label="Jito Tip"
        value={String(report.jitoTipLamports ?? "—")}
        unit="lamports"
      />
    </div>
  );
}

function FeeMetric({
  icon,
  label,
  value,
  unit,
}: {
  icon: string;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
      <span className="text-lg">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-mono font-bold text-white truncate">
          {value}
          <span className="text-[10px] text-slate-600 ml-1">{unit}</span>
        </p>
      </div>
    </div>
  );
}
