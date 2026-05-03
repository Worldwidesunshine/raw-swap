"use client";

import { useSwapStore } from "@/stores/swap-store";

export function FeeDisclosure() {
  const { urgency, userReview } = useSwapStore();

  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neon-orange/[0.04] border border-neon-orange/10">
      <span className="text-sm mt-0.5">💸</span>
      <p className="text-[11px] font-mono text-slate-500 leading-relaxed">
        Priority fee + Jito tip scale with urgency (
        <span className="text-neon-orange font-semibold">{urgency}</span>
        ).{" "}
        {userReview?.protocolFeeApplied ? (
          <>
            This swap includes a protocol fee on SOL input (12 bps to the buyback vault + 4 bps to
            treasury), in addition to network costs.{" "}
          </>
        ) : null}
        Simulation runs on RPC before Jito <span className="text-slate-400">sendTransaction</span>{" "}
        (bundleOnly).
      </p>
    </div>
  );
}
