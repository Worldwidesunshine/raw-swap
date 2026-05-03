"use client";

import { useState } from "react";
import type { LiquidityPoolEntry } from "@rawswap/shared";
import { PoolCard } from "@/components/liquidity/pool-card";
import { DepositForm } from "@/components/liquidity/deposit-form";
import { WithdrawForm } from "@/components/liquidity/withdraw-form";
import { useLiquidityPools } from "@/hooks/use-liquidity";
import { ApiRequestError, formatApiRequestError, type LiquidityVenue } from "@/lib/api-client";

function describePoolsError(error: unknown): string {
  if (error instanceof ApiRequestError) return formatApiRequestError(error);
  if (error instanceof Error) return error.message;
  return "Could not load pools — is the API running?";
}

export default function LiquidityPage() {
  const { data, isLoading, isError, error: poolsError, isFetching } = useLiquidityPools();
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [selectedPool, setSelectedPool] = useState<LiquidityPoolEntry | null>(null);

  const handlePoolSelect = (pool: LiquidityPoolEntry) => {
    setSelectedPool(pool);
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* Hero */}
        <section className="text-center pt-8 pb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-cyan/[0.06] border border-neon-cyan/15 mb-6">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-neon-cyan">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.7" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
            <span className="text-[11px] font-mono font-semibold text-neon-cyan uppercase tracking-widest">
              Liquidity Pools
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            <span className="gradient-text-degen">PROVIDE</span>
            <br />
            <span className="text-white">LIQUIDITY</span>
          </h1>

          <p className="text-sm md:text-base font-mono text-slate-500 max-w-lg mx-auto leading-relaxed">
            Earn fees by providing liquidity to RAWSWAP pools on Orca & Raydium.{" "}
            <span className="text-slate-400">Your assets, your yield, fully on-chain.</span>
          </p>
        </section>

        {/* Protocol Stats Bar */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Protocol Fee" value="16 bps" accent="green" />
          <StatCard label="Buyback Split" value="75%" accent="cyan" />
          <StatCard label="Treasury Split" value="25%" accent="purple" />
          <StatCard label="MEV Protection" value="Jito" accent="green" />
        </section>

        <div className="gradient-divider" />

        {/* Main Layout */}
        <div className="grid gap-10 lg:grid-cols-5 lg:gap-8 items-start">
          {/* Pools Column */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Available Pools
              </h2>
              {(isLoading || isFetching) && data && (
                <div className="w-1.5 h-1.5 rounded-full bg-neon-green pulse-dot" />
              )}
            </div>

            {(isLoading || isFetching) && !data && (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-36 rounded-2xl shimmer" />
                ))}
              </div>
            )}

            {isError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4">
                <p className="text-sm font-mono text-red-400" role="alert">
                  {describePoolsError(poolsError)}
                </p>
              </div>
            )}

            {data && data.pools.length === 0 && (
              <div className="rounded-2xl glass-card p-8 text-center">
                <div className="text-3xl mb-3">🏊</div>
                <p className="text-sm font-mono text-slate-400 mb-2">No pools configured yet</p>
                <p className="text-[11px] font-mono text-slate-600">
                  Pools will appear here once RAWSWAP/SOL pools are deployed on Orca or Raydium.
                </p>
              </div>
            )}

            {data && data.pools.length > 0 && (
              <div className="space-y-3">
                {data.pools.map((p) => (
                  <PoolCard
                    key={`${p.venue}-${p.address}`}
                    pool={p}
                    selected={selectedPool?.address === p.address && selectedPool?.venue === p.venue}
                    onSelect={handlePoolSelect}
                  />
                ))}
              </div>
            )}

            {/* How It Works */}
            <div className="rounded-2xl glass-card p-5 space-y-4 mt-6">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                How Staking Works
              </h3>
              <div className="space-y-3">
                <StepItem step={1} title="Deposit SOL" desc="Add SOL liquidity to a RAWSWAP pool" />
                <StepItem step={2} title="Earn Fees" desc="Collect swap fees from every trade in the pool" />
                <StepItem step={3} title="Buyback Flywheel" desc="75% of protocol fees buy back RAWSWAP tokens permanently" />
              </div>
            </div>
          </section>

          {/* Actions Column */}
          <section className="lg:col-span-3 lg:sticky lg:top-24">
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute -inset-3 bg-gradient-to-r from-neon-green/[0.03] via-transparent to-neon-purple/[0.03] rounded-3xl blur-xl" />

              <div className="relative rounded-2xl glass-heavy p-6 space-y-6">
                {/* Tabs */}
                <div className="tab-group">
                  <button
                    type="button"
                    onClick={() => setActiveTab("deposit")}
                    className={`tab-trigger ${activeTab === "deposit" ? "tab-trigger-active" : ""}`}
                  >
                    ⚡ Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("withdraw")}
                    className={`tab-trigger tab-trigger-withdraw ${activeTab === "withdraw" ? "tab-trigger-active" : ""}`}
                  >
                    💀 Withdraw
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === "deposit" ? (
                  <DepositForm
                    poolAddress={selectedPool?.address}
                    venue={selectedPool?.venue as LiquidityVenue | undefined}
                  />
                ) : (
                  <WithdrawForm
                    poolAddress={selectedPool?.address}
                    venue={selectedPool?.venue as LiquidityVenue | undefined}
                  />
                )}
              </div>
            </div>

            {/* Staking Rewards Info */}
            <div className="mt-6 rounded-2xl glass-card p-5 space-y-4">
              <h3 className="text-xs font-mono font-bold text-neon-green uppercase tracking-wider flex items-center gap-2">
                <span>🔥</span> Protocol Fee Distribution
              </h3>
              <div className="space-y-3">
                <FeeRow label="Total Protocol Fee" value="0.16%" color="text-white" />
                <FeeRow label="→ Buyback Vault (permanent LP)" value="0.12%" color="text-neon-green" />
                <FeeRow label="→ Treasury (operations)" value="0.04%" color="text-neon-cyan" />
              </div>
              <div className="gradient-divider" />
              <p className="text-[11px] font-mono text-slate-500 leading-relaxed">
                Protocol fees are collected on every SOL-input swap. The buyback vault permanently
                acquires RAWSWAP tokens and deepens pool liquidity — creating a deflationary flywheel
                that benefits all LP holders.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  const accentClasses: Record<string, string> = {
    green: "text-neon-green",
    cyan: "text-neon-cyan",
    purple: "text-neon-purple",
    orange: "text-neon-orange",
  };
  return (
    <div className="rounded-xl glass-card p-4 text-center">
      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">{label}</div>
      <div className={`text-lg font-mono font-black stat-value ${accentClasses[accent] ?? "text-white"}`}>{value}</div>
    </div>
  );
}

function StepItem({ step, title, desc }: { step: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="step-number shrink-0 text-sm">{step}</div>
      <div>
        <div className="text-sm font-bold text-white">{title}</div>
        <div className="text-[11px] font-mono text-slate-500 mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

function FeeRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-mono text-slate-400">{label}</span>
      <span className={`text-sm font-mono font-bold ${color}`}>{value}</span>
    </div>
  );
}
