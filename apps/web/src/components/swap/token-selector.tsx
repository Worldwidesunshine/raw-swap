"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { SwapToken } from "@rawswap/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTokenSearch } from "@/hooks/use-token-search";
import {
  looksLikeMintAddress,
  mergeUniqueTokens,
  pushRecentToken,
  readRecentTokens,
  shortenMint,
  tokenFallbackLabel,
  tokenProgramLabel,
  writeRecentTokens,
} from "@/lib/tokens";
import { useSwapStore } from "@/stores/swap-store";

type TokenSide = "input" | "output";

export function TokenSelector() {
  const inputToken = useSwapStore((state) => state.inputToken);
  const outputToken = useSwapStore((state) => state.outputToken);
  const setInputToken = useSwapStore((state) => state.setInputToken);
  const setOutputToken = useSwapStore((state) => state.setOutputToken);
  const flipTokens = useSwapStore((state) => state.flipTokens);
  const [activeSide, setActiveSide] = useState<TokenSide | null>(null);
  const [query, setQuery] = useState("");
  const [recentTokens, setRecentTokens] = useState<SwapToken[]>([]);
  const deferredQuery = useDeferredValue(query);
  const trimmedQuery = query.trim();
  const tokensQuery = useTokenSearch(activeSide ? deferredQuery : "", trimmedQuery ? 50 : 24);

  useEffect(() => {
    setRecentTokens(readRecentTokens());
  }, []);

  const blockedMint = activeSide === "input" ? outputToken.mint : inputToken.mint;
  const results = (tokensQuery.data ?? []).filter((token) => token.mint !== blockedMint);
  const visibleRecentTokens = useMemo(
    () => recentTokens.filter((token) => token.mint !== blockedMint),
    [blockedMint, recentTokens],
  );
  const featuredTokens = useMemo(() => {
    const recentMints = new Set(visibleRecentTokens.map((token) => token.mint));
    return results.filter((token) => !recentMints.has(token.mint));
  }, [results, visibleRecentTokens]);
  const exactMintMatch = useMemo(() => {
    if (!looksLikeMintAddress(trimmedQuery)) return null;
    return results.find((token) => token.mint === trimmedQuery) ?? null;
  }, [results, trimmedQuery]);

  function openPicker(side: TokenSide) {
    setActiveSide(side);
    setQuery("");
  }

  function closePicker() {
    setActiveSide(null);
    setQuery("");
  }

  function selectToken(token: SwapToken) {
    const nextRecentTokens = pushRecentToken(recentTokens, token);
    setRecentTokens(nextRecentTokens);
    writeRecentTokens(nextRecentTokens);
    if (activeSide === "input") {
      setInputToken(token);
    } else if (activeSide === "output") {
      setOutputToken(token);
    }
    closePicker();
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">
            Pair
          </label>
          <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
            Jupiter search
          </span>
        </div>

        <div className="grid gap-3">
          <TokenButton label="From" token={inputToken} onClick={() => openPicker("input")} />

          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full px-4"
              onClick={() => flipTokens()}
            >
              ⇅ Flip Pair
            </Button>
          </div>

          <TokenButton label="To" token={outputToken} onClick={() => openPicker("output")} />
        </div>
      </div>

      <Dialog open={activeSide !== null} onOpenChange={(open) => (!open ? closePicker() : undefined)}>
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-black uppercase tracking-wide text-white">
              Select {activeSide === "input" ? "Input" : "Output"} Token
            </p>
            <p className="text-[11px] font-mono text-slate-500">
              Search by symbol, name, or paste any routable SPL mint address.
            </p>
          </div>

          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="SOL, JUP, BONK, or mint address"
            className="h-12 font-mono"
          />

          <div className="rounded-xl border border-neon-cyan/15 bg-neon-cyan/[0.04] px-4 py-3">
            <div className="flex items-center gap-2">
              <Badge variant="cyan">All Tokens</Badge>
              <span className="text-[10px] font-mono uppercase tracking-widest text-neon-cyan/80">
                Jupiter-routable SPL search
              </span>
            </div>
            <p className="mt-2 text-[11px] font-mono leading-relaxed text-slate-400">
              Paste a full mint to import long-tail tokens directly. Recent picks stay pinned here
              for one-tap reuse.
            </p>
          </div>

          {exactMintMatch ? (
            <button
              type="button"
              className="w-full rounded-xl border border-neon-green/20 bg-neon-green/[0.05] px-4 py-3 text-left transition-colors hover:border-neon-green/35 hover:bg-neon-green/[0.08]"
              onClick={() => selectToken(exactMintMatch)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="green">Exact Mint Match</Badge>
                    <span className="truncate text-sm font-bold uppercase text-white">
                      {tokenFallbackLabel(exactMintMatch)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[11px] font-mono text-slate-400">
                    {shortenMint(exactMintMatch.mint)} · {tokenProgramLabel(exactMintMatch)}
                  </p>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-neon-green">
                  Use token
                </span>
              </div>
            </button>
          ) : null}

          <div className="max-h-96 overflow-auto space-y-4 pr-1">
            {tokensQuery.isLoading ? (
              <TokenResultState label="Searching token catalog…" />
            ) : tokensQuery.isError && trimmedQuery ? (
              <TokenResultState label="Token search is temporarily unavailable. Retry with a full mint address." />
            ) : trimmedQuery ? results.length === 0 ? (
              <TokenResultState
                label={
                  looksLikeMintAddress(trimmedQuery)
                    ? "No routable token metadata was found for that mint."
                    : "No tokens matched that query."
                }
              />
            ) : (
              <TokenSection
                label="Search Results"
                caption={`${results.length} token${results.length === 1 ? "" : "s"} matched`}
                tokens={mergeUniqueTokens(results)}
                onSelect={selectToken}
              />
            ) : (
              <>
                {visibleRecentTokens.length > 0 ? (
                  <TokenSection
                    label="Recent"
                    caption="Previously selected tokens"
                    tokens={visibleRecentTokens}
                    onSelect={selectToken}
                  />
                ) : null}
                {featuredTokens.length > 0 ? (
                  <TokenSection
                    label="Featured"
                    caption="Fast access to commonly routed tokens"
                    tokens={featuredTokens}
                    onSelect={selectToken}
                  />
                ) : (
                  <TokenResultState label="No tokens are available right now." />
                )}
              </>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
}

function TokenSection({
  label,
  caption,
  tokens,
  onSelect,
}: {
  label: string;
  caption: string;
  tokens: SwapToken[];
  onSelect: (token: SwapToken) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 px-1">
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{label}</span>
        <span className="text-[10px] font-mono text-slate-600">{caption}</span>
      </div>
      <div className="space-y-2">
        {tokens.map((token) => (
          <TokenResultButton key={token.mint} token={token} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function TokenButton({
  label,
  token,
  onClick,
}: {
  label: string;
  token: SwapToken;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left hover:border-neon-green/25 hover:bg-neon-green/[0.03] transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <TokenAvatar token={token} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{label}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold uppercase text-white">{tokenFallbackLabel(token)}</span>
            {token.isVerified ? (
              <span className="text-[9px] font-mono uppercase tracking-widest text-neon-green/80">
                verified
              </span>
            ) : null}
          </div>
          <p className="truncate text-[11px] font-mono text-slate-500">
            {token.name} · {shortenMint(token.mint)}
          </p>
        </div>
      </div>
    </button>
  );
}

function TokenResultButton({
  token,
  onSelect,
}: {
  token: SwapToken;
  onSelect: (token: SwapToken) => void;
}) {
  const programLabel = tokenProgramLabel(token);
  const isFallbackToken = token.tags.includes("onchain-fallback");

  return (
    <button
      type="button"
      className="w-full text-left rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 transition-colors hover:border-neon-green/30 hover:bg-neon-green/[0.04]"
      onClick={() => onSelect(token)}
    >
      <div className="flex items-center gap-3">
        <TokenAvatar token={token} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-white uppercase">{tokenFallbackLabel(token)}</span>
            <Badge variant={token.isVerified ? "green" : "default"}>
              {token.isVerified ? "Verified" : "Unverified"}
            </Badge>
            <Badge variant={programLabel === "token-2022" ? "orange" : "purple"}>
              {programLabel}
            </Badge>
            {isFallbackToken ? <Badge>On-chain</Badge> : null}
          </div>
          <p className="truncate text-[11px] font-mono text-slate-400">{token.name}</p>
          <p className="truncate text-[10px] font-mono text-slate-600">
            {shortenMint(token.mint)} · {token.decimals} decimals
            {token.organicScore !== null ? ` · organic ${token.organicScore.toFixed(1)}` : ""}
          </p>
        </div>
      </div>
    </button>
  );
}

function TokenAvatar({ token }: { token: SwapToken }) {
  if (token.icon) {
    return (
      <>
        {/* Remote token icons come from arbitrary Jupiter metadata hosts, so Next image
            optimization is not a good fit here without an overly broad remotePatterns allowlist. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={token.icon}
          alt={`${token.name} icon`}
          className="h-10 w-10 rounded-full border border-white/[0.06] bg-void-100 object-cover"
        />
      </>
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] bg-neon-green/[0.08] text-sm font-black uppercase text-neon-green">
      {tokenFallbackLabel(token).slice(0, 2)}
    </div>
  );
}

function TokenResultState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/[0.08] px-4 py-6 text-center text-[11px] font-mono text-slate-500">
      {label}
    </div>
  );
}
