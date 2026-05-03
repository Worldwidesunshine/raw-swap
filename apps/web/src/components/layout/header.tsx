"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWalletBootState } from "@/providers/providers";

const NAV_ITEMS = [
  { href: "/", label: "SWAP" },
  { href: "/liquidity", label: "LIQUIDITY" },
  { href: "/bridge", label: "BRIDGE" },
];

export function Header() {
  const pathname = usePathname();
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const walletBootState = useWalletBootState();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/[0.04]">
      <div className="container mx-auto flex items-center justify-between px-4 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group" onClick={() => setMobileOpen(false)}>
          <div className="relative">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              className="text-neon-green drop-shadow-[0_0_8px_rgba(57,255,20,0.6)] group-hover:animate-flicker transition-all"
            >
              <path
                d="M13 2L4 14h7l-2 8 9-12h-7l2-8z"
                fill="currentColor"
              />
            </svg>
            <div className="absolute -inset-1 bg-neon-green/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="font-black text-xl tracking-tight">
            <span className="neon-text-green">RAW</span>
            <span className="text-white">SWAP</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href} active={pathname === item.href}>
              {item.label}
            </NavLink>
          ))}
          <a
            href="https://jup.ag"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 text-xs font-mono font-semibold text-slate-500 hover:text-neon-purple transition-colors uppercase tracking-wider"
          >
            Jupiter ↗
          </a>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Network badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neon-orange/[0.06] border border-neon-orange/10">
            <div className="w-1.5 h-1.5 rounded-full bg-neon-orange pulse-dot" />
            <span className="text-[11px] font-mono text-neon-orange/80 uppercase tracking-wider">Devnet</span>
          </div>

          {/* Wallet Button */}
          {connected ? (
            <WalletMultiButton />
          ) : walletBootState.status === "ready" ? (
            <button
              type="button"
              className="wallet-adapter-button wallet-adapter-button-trigger"
              onClick={() => setVisible(true)}
            >
              Connect Wallet
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="wallet-adapter-button"
              title={walletBootState.errorMessage ?? undefined}
            >
              {walletBootState.status === "loading" ? "Loading…" : "Unavailable"}
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-slate-400">
              {mobileOpen ? (
                <path d="M5 5l10 10M5 15L15 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <>
                  <line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.04] mobile-menu-enter">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-mono font-semibold uppercase tracking-wider transition-all ${
                  pathname === item.href
                    ? "text-neon-green bg-neon-green/[0.08]"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <a
              href="https://jup.ag"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 rounded-xl text-sm font-mono font-semibold text-slate-500 hover:text-neon-purple uppercase tracking-wider transition-colors"
            >
              Jupiter ↗
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-all rounded-lg ${
        active
          ? "text-neon-green bg-neon-green/[0.08]"
          : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
      }`}
    >
      {children}
    </Link>
  );
}
