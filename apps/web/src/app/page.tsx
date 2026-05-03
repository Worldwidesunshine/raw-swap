"use client";

import { Suspense } from "react";
import Link from "next/link";
import { PairHydrator } from "@/components/swap/pair-hydrator";
import { SwapForm } from "@/components/swap/swap-form";
import { SubmitButton } from "@/components/execution/submit-button";
import { StatusTracker } from "@/components/execution/status-tracker";
import { ExecutionReportView } from "@/components/report/execution-report";
import { LatencyBreakdown } from "@/components/report/latency-breakdown";
import { FeeSummary } from "@/components/report/fee-summary";
import { useStatusPoll, useReport } from "@/hooks/use-status-poll";
import { useSwapStore } from "@/stores/swap-store";
import { Particles } from "@/components/layout/particles";

export default function HomePage() {
  const executionId = useSwapStore((s) => s.executionId);
  const executionAccessToken = useSwapStore((s) => s.executionAccessToken);
  const statusQ = useStatusPoll(executionId, executionAccessToken);
  const reportQ = useReport(executionId, executionAccessToken, statusQ.data as { status?: string } | null);

  return (
    <>
      <Suspense fallback={null}>
        <PairHydrator />
      </Suspense>
      <Particles />

      <div className="relative">
        {/* Hero */}
        <section className="text-center pt-16 pb-8 px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-green/[0.06] border border-neon-green/15 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-neon-green pulse-dot" />
            <span className="text-[11px] font-mono font-semibold text-neon-green uppercase tracking-widest">
              Live on Solana Mainnet
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">
            <span className="gradient-text-degen">BARE-METAL</span>
            <br />
            <span className="text-white">EXECUTION</span>
          </h1>

          <p className="text-sm md:text-base font-mono text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
            Self-custodial Solana token swaps via Jupiter + Jito.{" "}
            <span className="text-slate-400">Search any routable SPL mint. No wrappers. No bloat.</span>
          </p>

          {/* Speed stats */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <StatPill label="Execution" value="< 400ms" />
            <StatPill label="Tokens" value="Any SPL" />
            <StatPill label="MEV" value="Protected" />
            <StatPill label="Custody" value="Self" />
          </div>
        </section>

        {/* Swap Card */}
        <section className="max-w-lg mx-auto px-4 pb-8">
          <div className="relative">
            {/* Outer glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-neon-green/[0.04] via-neon-cyan/[0.02] to-neon-purple/[0.04] rounded-3xl blur-xl" />

            <div className="relative grid gap-4">
              <SwapForm />
              <SubmitButton />
              <StatusTracker status={statusQ.data ?? null} />
              <FeeSummary report={(reportQ.data as Record<string, unknown>) ?? null} />
              <LatencyBreakdown report={(reportQ.data as Record<string, unknown>) ?? null} />
              <ExecutionReportView report={reportQ.data ?? null} />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3">
              How <span className="neon-text-green">RawSwap</span> Works
            </h2>
            <p className="text-sm font-mono text-slate-500">Three steps. No intermediaries. Pure execution.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard
              step={1}
              emoji="🔗"
              title="Connect & Quote"
              description="Connect your Phantom or Solflare wallet. Select any SPL token pair and get an instant Jupiter V2 quote with real-time pricing."
            />
            <StepCard
              step={2}
              emoji="🔐"
              title="Review & Sign"
              description="We build a VersionedTransaction with your exact parameters. You review everything, then sign with your wallet. Keys never leave your device."
            />
            <StepCard
              step={3}
              emoji="⚡"
              title="Execute via Jito"
              description="Your signed tx is submitted through Jito's MEV-protected pipeline with DontFront sandwich protection. Sub-second landing."
            />
          </div>
        </section>

        {/* Features */}
        <section className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard
              emoji="⚡"
              title="Raw Speed"
              description="Jupiter V2 build API → Jito sendTransaction. No middleware, no abstraction layers. Just raw execution."
            />
            <FeatureCard
              emoji="🛡️"
              title="MEV Protected"
              description="Jito bundleOnly mode ensures your swap can't be sandwich attacked. Your tx, your terms."
            />
            <FeatureCard
              emoji="🔐"
              title="Self-Custodial"
              description="Keys never leave your wallet. We build the tx, you sign it. That's it. No approvals, no intermediaries."
            />
          </div>
        </section>

        {/* Protocol Fee Transparency */}
        <section className="max-w-3xl mx-auto px-4 py-12">
          <div className="rounded-2xl glass-heavy p-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-black text-white tracking-tight mb-2">
                🔥 Protocol Fee Transparency
              </h2>
              <p className="text-xs font-mono text-slate-500">Every basis point, fully on-chain and verifiable.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl bg-white/[0.02] border border-neon-green/20 p-5 text-center">
                <div className="text-3xl font-mono font-black neon-text-green stat-value">12 bps</div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-2">Buyback Vault</div>
                <div className="text-[10px] font-mono text-slate-600 mt-1">Permanent RAWSWAP/SOL LP</div>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-neon-cyan/20 p-5 text-center">
                <div className="text-3xl font-mono font-black neon-text-cyan stat-value">4 bps</div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-2">Treasury</div>
                <div className="text-[10px] font-mono text-slate-600 mt-1">Operations & development</div>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.08] p-5 text-center">
                <div className="text-3xl font-mono font-black text-white stat-value">16 bps</div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-2">Total</div>
                <div className="text-[10px] font-mono text-slate-600 mt-1">0.16% per SOL swap</div>
              </div>
            </div>

            <div className="gradient-divider mb-4" />
            <p className="text-[11px] font-mono text-slate-500 text-center leading-relaxed">
              Fees are applied as native SOL transfers after swap settlement and before Jito tip.
              BigInt floor division ensures zero floating-point errors.
            </p>
          </div>
        </section>

        {/* Ecosystem CTAs */}
        <section className="max-w-3xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/liquidity" className="group">
              <div className="rounded-2xl glass-card p-6 transition-all duration-300 hover:neon-border-green">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🏊</span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">Provide Liquidity</h3>
                </div>
                <p className="text-xs font-mono text-slate-500 leading-relaxed mb-4">
                  Earn swap fees by depositing SOL into RAWSWAP pools on Orca Whirlpool and Raydium CPMM.
                </p>
                <span className="text-[11px] font-mono text-neon-green uppercase tracking-wider group-hover:underline">
                  Explore pools →
                </span>
              </div>
            </Link>
            <Link href="/bridge" className="group">
              <div className="rounded-2xl glass-card p-6 transition-all duration-300 hover:neon-border-cyan">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🌉</span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">Cross-Chain Bridge</h3>
                </div>
                <p className="text-xs font-mono text-slate-500 leading-relaxed mb-4">
                  Bridge assets between Solana and EVM chains via deBridge DLN. Fast, secure, tracked.
                </p>
                <span className="text-[11px] font-mono text-neon-cyan uppercase tracking-wider group-hover:underline">
                  Bridge assets →
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="text-center py-12 px-4">
          <p className="text-xs font-mono text-slate-600 uppercase tracking-[0.2em]">
            dyor · nfa · wagmi · gm
          </p>
        </section>
      </div>
    </>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-sm md:text-base font-mono font-black text-white">{value}</span>
      <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function StepCard({
  step,
  emoji,
  title,
  description,
}: {
  step: number;
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group p-6 rounded-2xl glass-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="step-number">{step}</div>
        <span className="text-xl">{emoji}</span>
      </div>
      <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-2">{title}</h3>
      <p className="text-xs font-mono text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureCard({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group p-5 rounded-2xl glass neon-border-green hover:border-neon-green/30 transition-all duration-300 hover:-translate-y-1">
      <span className="text-2xl mb-3 block">{emoji}</span>
      <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-2">{title}</h3>
      <p className="text-xs font-mono text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}
