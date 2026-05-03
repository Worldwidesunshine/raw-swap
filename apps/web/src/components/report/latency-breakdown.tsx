"use client";

export function LatencyBreakdown({ report }: { report: Record<string, unknown> | null }) {
  if (!report) return null;

  const stages = [
    { key: "quoteMs", label: "Quote", icon: "📊" },
    { key: "buildMs", label: "Build", icon: "🔧" },
    { key: "simulationMs", label: "Simulate", icon: "🧪" },
    { key: "sendMs", label: "Send", icon: "📡" },
    { key: "timeToLandMs", label: "Land", icon: "🎯" },
  ];

  const values = stages.map((s) => Number(report[s.key] ?? 0));
  const maxVal = Math.max(...values, 1);

  return (
    <div className="space-y-2 animate-slide-up">
      <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">
        ⚡ Latency Breakdown
      </span>
      <div className="space-y-1.5">
        {stages.map((stage, i) => {
          const ms = values[i];
          const pct = Math.max((ms / maxVal) * 100, 2);
          const color =
            ms < 100
              ? "bg-neon-green"
              : ms < 500
                ? "bg-neon-orange"
                : "bg-neon-pink";

          return (
            <div key={stage.key} className="flex items-center gap-2">
              <span className="text-xs w-5 text-center">{stage.icon}</span>
              <span className="text-[10px] font-mono text-slate-500 w-16 uppercase">
                {stage.label}
              </span>
              <div className="flex-1 h-4 rounded-md bg-white/[0.03] border border-white/[0.04] overflow-hidden">
                <div
                  className={`h-full rounded-md ${color} transition-all duration-500`}
                  style={{ width: `${pct}%`, opacity: 0.6 }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-white w-14 text-right">
                {ms ? `${ms}ms` : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
