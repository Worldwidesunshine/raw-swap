"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSwapStore } from "@/stores/swap-store";

const PRESETS = [10, 50, 100, 200];

export function SlippageSettings() {
  const { slippageBps, setField } = useSwapStore();

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">
        Slippage (bps)
      </label>
      <div className="flex gap-2">
        {PRESETS.map((bps) => (
          <Button
            key={bps}
            type="button"
            variant={slippageBps === bps ? "default" : "outline"}
            size="sm"
            className="flex-1 text-xs"
            onClick={() => setField("slippageBps", bps)}
          >
            {bps}
          </Button>
        ))}
        <Input
          type="number"
          value={slippageBps}
          onChange={(e) => setField("slippageBps", Number(e.target.value))}
          className="w-20 h-9 text-xs text-center"
          min={1}
          max={5000}
        />
      </div>
    </div>
  );
}
