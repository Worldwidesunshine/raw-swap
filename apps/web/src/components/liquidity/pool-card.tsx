"use client";

import type { LiquidityPoolEntry } from "@rawswap/shared";

function VenueIcon({ venue }: { venue: string }) {
  if (venue === "orca_whirlpool") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-neon-cyan">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5c-2.49 0-4.5-2.01-4.5-4.5S8.51 7.5 11 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm5.5-4.5c0 1.38-.56 2.63-1.46 3.54l1.42 1.42A6.46 6.46 0 0 0 18.5 12c0-1.8-.73-3.43-1.9-4.61L15.17 8.8A4.49 4.49 0 0 1 16.5 12z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-neon-purple">
      <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.7" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );
}

function venueBadgeClass(venue: string) {
  return venue === "orca_whirlpool" ? "badge-venue badge-orca" : "badge-venue badge-raydium";
}

function venueLabel(venue: string) {
  return venue === "orca_whirlpool" ? "Orca" : "Raydium";
}

function truncateAddress(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function PoolCard({
  pool,
  selected,
  onSelect,
}: {
  pool: LiquidityPoolEntry;
  selected?: boolean;
  onSelect?: (pool: LiquidityPoolEntry) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(pool)}
      className={`relative w-full text-left rounded-2xl p-5 glass-card card-glow-green transition-all duration-300 group ${
        selected
          ? "neon-border-green bg-neon-green/[0.04]"
          : "border border-white/[0.06] hover:border-white/[0.12]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
            <VenueIcon venue={pool.venue} />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight">
              {pool.label ?? "RAWSWAP / SOL"}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              {truncateAddress(pool.address)}
            </div>
          </div>
        </div>
        <span className={venueBadgeClass(pool.venue)}>{venueLabel(pool.venue)}</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-2.5 text-center">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">TVL</div>
          <div className="text-sm font-mono font-bold text-white">—</div>
        </div>
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-2.5 text-center">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">APY</div>
          <div className="text-sm font-mono font-bold text-neon-green">—</div>
        </div>
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-2.5 text-center">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Fee</div>
          <div className="text-sm font-mono font-bold text-slate-300">16 bps</div>
        </div>
      </div>

      {/* Selected indicator */}
      {selected && (
        <div className="absolute top-3 right-3">
          <div className="w-2.5 h-2.5 rounded-full bg-neon-green pulse-dot" />
        </div>
      )}
    </button>
  );
}
