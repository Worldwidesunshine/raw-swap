"use client";

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import type { WalletAdapter } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { QueryProvider } from "./query-provider";
import { Toaster, toast } from "sonner";
import { SOLANA_RPC } from "@/lib/constants";

import "@solana/wallet-adapter-react-ui/styles.css";

type WalletBootState = {
  status: "loading" | "ready" | "error";
  errorMessage: string | null;
};

const WalletBootContext = createContext<WalletBootState>({
  status: "loading",
  errorMessage: null,
});

export function useWalletBootState() {
  return useContext(WalletBootContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => SOLANA_RPC, []);
  const [wallets, setWallets] = useState<WalletAdapter[]>([]);
  const [walletBootState, setWalletBootState] = useState<WalletBootState>({
    status: "loading",
    errorMessage: null,
  });

  useEffect(() => {
    let active = true;

    void Promise.all([
      import("@solana/wallet-adapter-phantom"),
      import("@solana/wallet-adapter-solflare"),
    ])
      .then(([phantom, solflare]) => {
        if (!active) return;
        setWallets([new phantom.PhantomWalletAdapter(), new solflare.SolflareWalletAdapter()]);
        setWalletBootState({ status: "ready", errorMessage: null });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message =
          error instanceof Error ? error.message : "Wallet adapters failed to initialize.";
        setWalletBootState({ status: "error", errorMessage: message });
        toast.error("Wallet adapters failed to load.", {
          description: "Reload the page to retry Phantom or Solflare initialization.",
        });
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect
        onError={(error) => {
          toast.error(error.message || "Wallet connection failed.", {
            description: "Check Phantom and retry the connection.",
          });
        }}
      >
        <WalletBootContext.Provider value={walletBootState}>
          <WalletModalProvider>
            <QueryProvider>
              {children}
              <Toaster richColors position="top-right" />
            </QueryProvider>
          </WalletModalProvider>
        </WalletBootContext.Provider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
