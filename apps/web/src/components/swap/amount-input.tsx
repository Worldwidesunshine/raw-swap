"use client";

import { Input } from "@/components/ui/input";
import { useSwapStore } from "@/stores/swap-store";
import {
  isUiAmountInput,
  tokenFallbackLabel,
  uiAmountError,
  uiAmountToBaseUnits,
} from "@/lib/tokens";

export function AmountInput() {
  const { amount, inputToken, setField } = useSwapStore();
  const amountError = uiAmountError(amount, inputToken.decimals);
  const baseAmount = uiAmountToBaseUnits(amount, inputToken.decimals);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">
          Amount
        </label>
        <span className="text-[10px] font-mono text-slate-600">
          {inputToken.decimals === 0
            ? "whole units only"
            : `up to ${inputToken.decimals} decimals`}
        </span>
      </div>
      <div className="relative">
        <Input
          value={amount}
          inputMode="decimal"
          onChange={(e) => {
            if (isUiAmountInput(e.target.value)) {
              setField("amount", e.target.value);
            }
          }}
          className="pr-20 text-lg h-14 font-mono font-bold text-white"
          placeholder="1"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-neon-green/70 uppercase">
            {tokenFallbackLabel(inputToken)}
          </span>
        </div>
      </div>
      <p
        className={`text-[10px] font-mono break-all ${
          amountError ? "text-rose-400" : "text-slate-600"
        }`}
      >
        {amountError
          ? amountError
          : `On-chain input amount: ${baseAmount} base units for ${inputToken.name}.`}
      </p>
    </div>
  );
}
