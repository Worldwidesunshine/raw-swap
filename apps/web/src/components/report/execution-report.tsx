"use client";

import { useState } from "react";

export function ExecutionReportView({ report }: { report: unknown }) {
  const [expanded, setExpanded] = useState(false);
  if (!report) return null;

  return (
    <div className="space-y-2 animate-slide-up">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-[11px] font-mono text-slate-500 uppercase tracking-widest hover:text-neon-green transition-colors w-full"
      >
        <span>📋</span>
        Execution Report
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`transition-transform duration-200 ml-auto ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded && (
        <pre className="text-[11px] font-mono bg-void-100 text-neon-green/70 p-4 rounded-xl overflow-auto max-h-96 border border-neon-green/10 animate-slide-down">
          {JSON.stringify(report, null, 2)}
        </pre>
      )}
    </div>
  );
}
