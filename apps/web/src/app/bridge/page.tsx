"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { ChainSelector } from "@/components/bridge/chain-selector";
import {
  useBridgeHelpers,
  usePatchCrossChainTransfer,
  useRecentCrossChainTransfers,
  useRecordCrossChainTransfer,
} from "@/hooks/use-bridge";
import { ApiRequestError, formatApiRequestError } from "@/lib/api-client";
import { ensureWalletSession, getCachedWalletSession } from "@/lib/wallet-session";

function formatMutationError(err: unknown): string | null {
  if (!err) return null;
  if (err instanceof ApiRequestError) return formatApiRequestError(err);
  if (err instanceof Error) return err.message;
  return "Request failed";
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    created: { bg: "bg-neon-orange/[0.08]", text: "text-neon-orange", dot: "bg-neon-orange" },
    fulfilled: { bg: "bg-neon-green/[0.08]", text: "text-neon-green", dot: "bg-neon-green" },
    failed: { bg: "bg-red-500/[0.08]", text: "text-red-400", dot: "bg-red-400" },
  };
  const s = map[status] ?? { bg: "bg-white/[0.04]", text: "text-slate-400", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider ${s.bg} ${s.text}`}>
      <span className={`w-1 h-1 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

export default function BridgePage() {
  const { publicKey, signMessage } = useWallet();
  const [sourceChain, setSourceChain] = useState("solana");
  const [destChain, setDestChain] = useState("ethereum");
  const [walletSessionToken, setWalletSessionToken] = useState<string | null>(null);
  const { sampleCreateTxUrl } = useBridgeHelpers();
  const {
    data: recent,
    isLoading: recentLoading,
    isError: recentIsError,
    error: recentError,
    isFetching: recentFetching,
  } = useRecentCrossChainTransfers({
    limit: 10,
    wallet: publicKey?.toBase58(),
    walletSessionToken,
  });
  const record = useRecordCrossChainTransfer();
  const patch = usePatchCrossChainTransfer();
  const [orderId, setOrderId] = useState("");

  const syncBusy = record.isPending || patch.isPending;

  const recordErrorText = useMemo(() => formatMutationError(record.error), [record.error]);
  const patchErrorText = useMemo(() => formatMutationError(patch.error), [patch.error]);
  const recentErrorText = useMemo(() => {
    if (!recentIsError) return null;
    return formatMutationError(recentError);
  }, [recentIsError, recentError]);
  const showRecentLoading = (recentLoading || recentFetching) && !recent;

  useEffect(() => {
    if (!publicKey) {
      setWalletSessionToken(null);
      return;
    }
    setWalletSessionToken(getCachedWalletSession(publicKey.toBase58())?.walletSessionToken ?? null);
  }, [publicKey]);

  async function ensureBridgeSessionToken() {
    if (!publicKey || !signMessage) {
      throw new Error("Connect a wallet that supports message signing to use the bridge.");
    }
    const session = await ensureWalletSession({
      walletPublicKey: publicKey.toBase58(),
      signMessage,
    });
    setWalletSessionToken(session.walletSessionToken);
    return session.walletSessionToken;
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-12">
        {/* Hero */}
        <section className="text-center pt-8 pb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-cyan/[0.06] border border-neon-cyan/15 mb-6">
            <span className="text-sm">🌉</span>
            <span className="text-[11px] font-mono font-semibold text-neon-cyan uppercase tracking-widest">
              Cross-Chain Bridge
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            <span className="gradient-text-degen">BRIDGE</span>
            <br />
            <span className="text-white">ASSETS</span>
          </h1>

          <p className="text-sm md:text-base font-mono text-slate-500 max-w-lg mx-auto leading-relaxed">
            Move assets between Solana and EVM chains via deBridge DLN.{" "}
            <span className="text-slate-400">Fast settlement, cross-chain liquidity.</span>
          </p>
        </section>

        {/* Bridge Card */}
        <div className="max-w-lg mx-auto">
          <div className="relative">
            <div className="absolute -inset-3 bg-gradient-to-r from-neon-cyan/[0.03] via-transparent to-neon-purple/[0.03] rounded-3xl blur-xl" />

            <div className="relative rounded-2xl glass-heavy p-6 space-y-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Transfer Configuration
              </h2>

              {/* Chain Selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">From</label>
                  <ChainSelector id="bridge-source-chain" value={sourceChain} onChange={setSourceChain} disabled={syncBusy} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">To</label>
                  <ChainSelector id="bridge-dest-chain" value={destChain} onChange={setDestChain} disabled={syncBusy} />
                </div>
              </div>

              {/* Order ID */}
              <div className="space-y-2">
                <label htmlFor="bridge-order-id" className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Order ID (DLN)
                </label>
                <input
                  id="bridge-order-id"
                  className="input-degen"
                  placeholder="Optional — paste deBridge order ID"
                  value={orderId}
                  disabled={syncBusy}
                  autoComplete="off"
                  onChange={(e) => setOrderId(e.target.value)}
                />
              </div>

              {/* DLN URL Preview */}
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">DLN API URL</div>
                <p className="text-[11px] font-mono text-slate-400 break-all leading-relaxed">
                  {sampleCreateTxUrl("RawSwapBridge")}
                </p>
              </div>

              {/* Submit */}
              <button
                type="button"
                className="w-full rounded-xl border border-neon-cyan/30 bg-gradient-to-r from-neon-cyan/[0.12] to-neon-green/[0.08] py-3.5 text-sm font-mono font-bold uppercase tracking-wider text-neon-cyan transition-all hover:from-neon-cyan/[0.2] hover:to-neon-green/[0.12] hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={syncBusy}
                onClick={() => {
                  if (record.isPending || patch.isPending) return;
                  void (async () => {
                    try {
                      const sessionToken = await ensureBridgeSessionToken();
                      record.mutate({
                        body: {
                          provider: "debridge_dln",
                          orderId: orderId || undefined,
                          sourceChain,
                          destChain,
                          status: "created",
                        },
                        walletSessionToken: sessionToken,
                      });
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Bridge authorization failed");
                    }
                  })();
                }}
              >
                {record.isPending ? "Recording…" : "🌉 Initiate Bridge"}
              </button>

              {recordErrorText && (
                <div className="px-3 py-2.5 rounded-lg bg-red-500/[0.06] border border-red-500/20">
                  <p className="text-xs font-mono text-red-400">{recordErrorText}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Transfers */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Recent Transfers
          </h2>

          {showRecentLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl shimmer" />
              ))}
            </div>
          )}

          {recentErrorText && (
            <div className="px-3 py-2.5 rounded-lg bg-red-500/[0.06] border border-red-500/20">
              <p className="text-xs font-mono text-red-400">{recentErrorText}</p>
            </div>
          )}

          {patchErrorText && (
            <div className="px-3 py-2.5 rounded-lg bg-red-500/[0.06] border border-red-500/20">
              <p className="text-xs font-mono text-red-400">{patchErrorText}</p>
            </div>
          )}

          {!publicKey && !showRecentLoading && !recentErrorText && (
            <div className="rounded-2xl glass-card p-8 text-center">
              <p className="text-sm font-mono text-slate-400">Connect a wallet to view your bridge transfers.</p>
            </div>
          )}

          {publicKey && !walletSessionToken && !showRecentLoading && !recentErrorText && (
            <div className="rounded-2xl glass-card p-8 text-center space-y-3">
              <p className="text-sm font-mono text-slate-400">Unlock bridge tracking with a one-time wallet signature.</p>
              <button
                type="button"
                className="rounded-lg border border-neon-cyan/20 bg-neon-cyan/[0.04] px-4 py-2 text-[11px] font-mono font-semibold text-neon-cyan uppercase tracking-wider hover:bg-neon-cyan/[0.08] transition-all"
                onClick={() => {
                  void ensureBridgeSessionToken().catch((error) => {
                    toast.error(
                      error instanceof Error ? error.message : "Bridge authorization failed",
                    );
                  });
                }}
              >
                Unlock Tracking
              </button>
            </div>
          )}

          {recent && recent.transfers.length === 0 && !showRecentLoading && !recentErrorText && (
            <div className="rounded-2xl glass-card p-8 text-center">
              <div className="text-3xl mb-3">🌉</div>
              <p className="text-sm font-mono text-slate-400">No bridge transfers yet</p>
              <p className="text-[11px] font-mono text-slate-600 mt-1">Transfers will appear here once initiated.</p>
            </div>
          )}

          {recent && recent.transfers.length > 0 && (
            <div className="space-y-2">
              {recent.transfers.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl glass-card p-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {statusBadge(t.status)}
                      <span className="text-[11px] font-mono text-slate-500">
                        {t.provider}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-600 truncate">
                      {t.orderId ?? t.id.slice(0, 12)}…
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-neon-green/20 bg-neon-green/[0.04] px-3 py-1.5 text-[10px] font-mono font-semibold text-neon-green uppercase tracking-wider hover:bg-neon-green/[0.08] disabled:opacity-40 transition-all"
                      disabled={patch.isPending}
                      onClick={() => {
                        void (async () => {
                          try {
                            const sessionToken = await ensureBridgeSessionToken();
                            patch.mutate({
                              id: t.id,
                              body: { status: "fulfilled" },
                              walletSessionToken: sessionToken,
                            });
                          } catch (error) {
                            toast.error(
                              error instanceof Error ? error.message : "Bridge authorization failed",
                            );
                          }
                        })();
                      }}
                    >
                      {patch.isPending && patch.variables?.id === t.id ? "…" : "✓ Fulfill"}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-red-500/20 bg-red-500/[0.04] px-3 py-1.5 text-[10px] font-mono font-semibold text-red-400 uppercase tracking-wider hover:bg-red-500/[0.08] disabled:opacity-40 transition-all"
                      disabled={patch.isPending}
                      onClick={() => {
                        void (async () => {
                          try {
                            const sessionToken = await ensureBridgeSessionToken();
                            patch.mutate({
                              id: t.id,
                              body: { status: "failed" },
                              walletSessionToken: sessionToken,
                            });
                          } catch (error) {
                            toast.error(
                              error instanceof Error ? error.message : "Bridge authorization failed",
                            );
                          }
                        })();
                      }}
                    >
                      {patch.isPending && patch.variables?.id === t.id ? "…" : "✗ Failed"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
