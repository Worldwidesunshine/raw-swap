"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { QuoteRequest } from "@rawswap/shared";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useQuote } from "@/hooks/use-quote";
import { uiAmountError, uiAmountToBaseUnits } from "@/lib/tokens";
import { useWalletBootState } from "@/providers/providers";
import { useSwapStore } from "@/stores/swap-store";
import { TokenSelector } from "./token-selector";
import { AmountInput } from "./amount-input";
import { QuotePreview } from "./quote-preview";
import { SlippageSettings } from "./slippage-settings";
import { AdvancedSettings } from "./advanced-settings";
import { FeeDisclosure } from "./fee-disclosure";
import { WalletInfo } from "../wallet/wallet-info";

export function SwapForm() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const walletBootState = useWalletBootState();
  const store = useSwapStore();
  const setQuote = useSwapStore((s) => s.setQuote);
  const quoteMut = useQuote();
  const baseAmount = uiAmountToBaseUnits(store.amount, store.inputToken.decimals);
  const amountError = uiAmountError(store.amount, store.inputToken.decimals);
  const sameMint = store.inputMint === store.outputMint;
  const canOpenWalletModal = !connected && walletBootState.status === "ready";
  const disconnectedLabel =
    walletBootState.status === "loading"
      ? "Loading Wallets…"
      : walletBootState.status === "error"
        ? "Wallets Unavailable"
        : "🔌 Connect Wallet";
  const buttonLabel = !connected
    ? disconnectedLabel
    : quoteMut.isPending
      ? "⏳ Fetching quote…"
      : sameMint
        ? "Choose Different Tokens"
        : amountError
          ? "Enter Valid Amount"
          : "🔥 Get Quote";

  async function getQuote() {
    if (!publicKey || !baseAmount) return;
    const body: QuoteRequest = {
      inputMint: store.inputMint,
      outputMint: store.outputMint,
      amount: baseAmount,
      slippageBps: store.slippageBps,
      userPublicKey: publicKey.toBase58(),
    };
    const res = await quoteMut.mutateAsync(body);
    setQuote(res);
  }

  return (
    <Card className="relative overflow-visible">
      {/* Top glow accent */}
      <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-neon-green/50 to-transparent" />

      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black uppercase tracking-tight text-white">
            ⚡ Swap
          </span>
          <span className="text-[10px] font-mono text-neon-green/60 uppercase tracking-widest">
            raw
          </span>
        </div>
        <WalletInfo />
      </CardHeader>

      <CardContent className="space-y-4">
        <TokenSelector />
        <AmountInput />

        {/* Separator */}
        <div className="relative py-1">
          <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>

        <SlippageSettings />
        <AdvancedSettings />
        <FeeDisclosure />

        <Button
          variant="degen"
          disabled={
            connected
              ? quoteMut.isPending || sameMint || !baseAmount
              : walletBootState.status !== "ready"
          }
          className="w-full h-12 text-sm"
          onClick={() => {
            if (!connected) {
              if (canOpenWalletModal) setVisible(true);
              return;
            }
            void getQuote();
          }}
        >
          {buttonLabel}
        </Button>

        <QuotePreview quote={store.quotePayload} />
      </CardContent>
    </Card>
  );
}
