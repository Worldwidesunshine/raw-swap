"use client";

import { useState } from "react";
import { useSwapStore } from "@/stores/swap-store";
import { Button } from "@/components/ui/button";

export function AdvancedSettings() {
  const { urgency, executionMode, setField } = useSwapStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-[11px] font-mono text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors w-full"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        >
          <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Advanced Settings
        <div className="flex-1 h-px bg-white/[0.04]" />
      </button>

      {open && (
        <div className="grid grid-cols-2 gap-3 animate-slide-down p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          {/* Urgency */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
              Urgency 🔥
            </span>
            <div className="flex gap-1">
              {(["low", "normal", "high"] as const).map((u) => (
                <Button
                  key={u}
                  size="sm"
                  type="button"
                  variant={urgency === u ? "default" : "outline"}
                  onClick={() => setField("urgency", u)}
                  className="flex-1 text-[10px] px-2"
                >
                  {u === "high" ? "🚀" : u === "normal" ? "⚡" : "🐢"} {u}
                </Button>
              ))}
            </div>
          </div>

          {/* Execution */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
              Execution 🛡️
            </span>
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                type="button"
                variant={executionMode === "jito_single_tx" ? "default" : "outline"}
                onClick={() => setField("executionMode", "jito_single_tx")}
                className="text-[10px]"
              >
                Jito + Fallback
              </Button>
              <Button
                size="sm"
                type="button"
                variant={executionMode === "fallback_rpc" ? "default" : "outline"}
                onClick={() => setField("executionMode", "fallback_rpc")}
                className="text-[10px]"
              >
                RPC Only
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
