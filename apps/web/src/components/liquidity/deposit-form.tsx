"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLiquidityDeposit, useLiquidityPreviewDeposit } from "@/hooks/use-liquidity";
import { ApiRequestError, formatApiRequestError, type LiquidityVenue } from "@/lib/api-client";

const VENUES: { value: LiquidityVenue; label: string }[] = [
  { value: "orca_whirlpool", label: "Orca Whirlpool" },
  { value: "raydium_cpmm", label: "Raydium CPMM" },
];

export function DepositForm({
  poolAddress: externalPool,
  venue: externalVenue,
}: {
  poolAddress?: string;
  venue?: LiquidityVenue;
}) {
  const { connected, publicKey } = useWallet();
  const [poolAddress, setPoolAddress] = useState(externalPool ?? "");
  const [venue, setVenue] = useState<LiquidityVenue>(externalVenue ?? "orca_whirlpool");
  const [amount, setAmount] = useState("");
  const deposit = useLiquidityDeposit();
  const preview = useLiquidityPreviewDeposit();
  const actionPending = deposit.isPending || preview.isPending;

  // Sync external pool selection
  useEffect(() => {
    if (externalPool) setPoolAddress(externalPool);
    if (externalVenue) setVenue(externalVenue);
  }, [externalPool, externalVenue]);

  const previewErrorMessage = useMemo(() => {
    const err = preview.error;
    if (!err) return null;
    if (err instanceof ApiRequestError) {
      if (err.status === 501) return "Deposit instructions coming soon — pool SDK integration in progress.";
      return formatApiRequestError(err);
    }
    return err instanceof Error ? err.message : "Preview failed";
  }, [preview.error]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (actionPending) return;
    deposit.mutate({ poolAddress: poolAddress.trim(), venue, amount: amount.trim() || "0", userPublicKey: publicKey?.toBase58() });
  }

  const presetAmounts = ["0.1", "0.5", "1.0", "5.0"];

  return (
    <form onSubmit={onSubmit} aria-busy={actionPending} className="space-y-5">
      {/* Pool Address */}
      <div className="space-y-2">
        <label htmlFor="deposit-pool" className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          Pool Address
        </label>
        <input
          id="deposit-pool"
          value={poolAddress}
          onChange={(e) => setPoolAddress(e.target.value)}
          placeholder="Select a pool or paste address…"
          autoComplete="off"
          disabled={actionPending}
          className="input-degen"
        />
      </div>

      {/* Venue */}
      <div className="space-y-2">
        <label htmlFor="deposit-venue" className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          Protocol
        </label>
        <select
          id="deposit-venue"
          value={venue}
          onChange={(e) => setVenue(e.target.value as LiquidityVenue)}
          disabled={actionPending}
          className="input-degen"
        >
          {VENUES.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="deposit-amount" className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Amount (SOL)
          </label>
        </div>
        <div className="relative">
          <input
            id="deposit-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
            disabled={actionPending}
            className="input-degen pr-14 text-lg"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">SOL</span>
        </div>
        <div className="flex gap-2">
          {presetAmounts.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(preset)}
              disabled={actionPending}
              className="flex-1 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-[11px] font-mono text-slate-400 hover:bg-white/[0.05] hover:text-white hover:border-white/[0.12] transition-all disabled:opacity-40"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Status Messages */}
      {deposit.statusMessage && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-neon-green/[0.06] border border-neon-green/20">
          <div className="w-1.5 h-1.5 rounded-full bg-neon-green pulse-dot" />
          <p className="text-xs font-mono text-neon-green">{deposit.statusMessage}</p>
        </div>
      )}
      {deposit.errorMessage && (
        <div className="px-3 py-2.5 rounded-lg bg-red-500/[0.06] border border-red-500/20">
          <p className="text-xs font-mono text-red-400">{deposit.errorMessage}</p>
        </div>
      )}
      {previewErrorMessage && (
        <div className="px-3 py-2.5 rounded-lg bg-neon-orange/[0.06] border border-neon-orange/20">
          <p className="text-xs font-mono text-neon-orange">{previewErrorMessage}</p>
        </div>
      )}

      {preview.isSuccess && preview.data && (
        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
          <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
            {preview.data.sdkNextStep}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          disabled={actionPending || !poolAddress.trim()}
          onClick={() => {
            if (actionPending) return;
            preview.mutate({ poolAddress: poolAddress.trim(), venue, amount: amount.trim() || "0", userPublicKey: publicKey?.toBase58() });
          }}
          className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 text-xs font-mono uppercase tracking-wider text-slate-300 hover:bg-white/[0.06] hover:border-white/[0.15] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {preview.isPending ? "Loading…" : "Preview"}
        </button>
        <button
          type="submit"
          disabled={actionPending || !poolAddress.trim() || !connected}
          className="flex-[2] rounded-xl border border-neon-green/30 bg-gradient-to-r from-neon-green/[0.12] to-neon-cyan/[0.08] py-3 text-sm font-mono font-bold uppercase tracking-wider text-neon-green transition-all hover:from-neon-green/[0.2] hover:to-neon-cyan/[0.12] hover:shadow-[0_0_20px_rgba(57,255,20,0.15)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {!connected
            ? "Connect Wallet"
            : deposit.isPending
              ? "Depositing…"
              : "⚡ Deposit"}
        </button>
      </div>
    </form>
  );
}
