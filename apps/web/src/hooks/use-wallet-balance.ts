"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";

export function useWalletBalance() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [sol, setSol] = useState<number | null>(null);

  useEffect(() => {
    if (!connected || !publicKey) {
      setSol(null);
      return;
    }
    let cancelled = false;
    connection.getBalance(publicKey).then((b) => {
      if (!cancelled) setSol(b / LAMPORTS_PER_SOL);
    });
    return () => {
      cancelled = true;
    };
  }, [connection, publicKey, connected]);

  return { solBalance: sol };
}
