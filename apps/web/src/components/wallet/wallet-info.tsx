"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletBalance } from "@/hooks/use-wallet-balance";

export function WalletInfo() {
  const { publicKey, connected } = useWallet();
  const { solBalance } = useWalletBalance();
  if (!connected || !publicKey) return null;

  const addr = publicKey.toBase58();
  const short = `${addr.slice(0, 4)}…${addr.slice(-4)}`;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
      <div className="w-1.5 h-1.5 rounded-full bg-sol-green pulse-dot" />
      <span className="text-[11px] font-mono text-slate-400">
        {short}
      </span>
      {solBalance != null && (
        <>
          <div className="w-px h-3 bg-white/[0.08]" />
          <span className="text-[11px] font-mono font-bold text-neon-green">
            {solBalance.toFixed(4)} SOL
          </span>
        </>
      )}
    </div>
  );
}
