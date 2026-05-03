import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.04] py-10 mt-auto">
      <div className="container mx-auto px-4">
        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <FooterPill emoji="⚡" text="Self-Custodial" />
          <FooterPill emoji="🛡️" text="Jito MEV Protection" />
          <FooterPill emoji="🔥" text="Sub-Second Execution" />
          <FooterPill emoji="💀" text="No Middlemen" />
          <FooterPill emoji="🏊" text="LP Staking" />
        </div>

        <div className="gradient-divider mb-8" />

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto mb-8">
          {/* Product */}
          <div className="space-y-3">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Product</div>
            <div className="space-y-2">
              <FooterNavLink href="/">Swap</FooterNavLink>
              <FooterNavLink href="/liquidity">Liquidity</FooterNavLink>
              <FooterNavLink href="/bridge">Bridge</FooterNavLink>
            </div>
          </div>

          {/* Ecosystem */}
          <div className="space-y-3">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Ecosystem</div>
            <div className="space-y-2">
              <FooterLink href="https://jup.ag" label="Jupiter" />
              <FooterLink href="https://jito.wtf" label="Jito" />
              <FooterLink href="https://solana.com" label="Solana" />
            </div>
          </div>

          {/* DEX */}
          <div className="space-y-3">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">DEX</div>
            <div className="space-y-2">
              <FooterLink href="https://orca.so" label="Orca" />
              <FooterLink href="https://raydium.io" label="Raydium" />
              <FooterLink href="https://app.debridge.finance" label="deBridge" />
            </div>
          </div>

          {/* Social */}
          <div className="space-y-3">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Community</div>
            <div className="space-y-2">
              <FooterLink href="https://x.com/rawswap" label="Twitter / X" />
              <FooterLink href="https://discord.gg/rawswap" label="Discord" />
              <FooterLink href="https://github.com/Worldwidesunshine/raw-swap" label="GitHub" />
            </div>
          </div>
        </div>

        {/* Protocol Stats */}
        <div className="flex flex-wrap justify-center gap-6 mb-6">
          <MiniStat label="Protocol Fee" value="16 bps" />
          <MiniStat label="Buyback" value="75%" />
          <MiniStat label="Treasury" value="25%" />
        </div>

        {/* Bottom */}
        <div className="text-center space-y-2">
          <p className="text-[11px] font-mono text-slate-600 uppercase tracking-widest">
            Built on{" "}
            <span className="gradient-text-sol font-bold">Solana</span>
            {" "}· DYOR · NFA
          </p>
          <p className="text-[10px] font-mono text-slate-700">
            © {new Date().getFullYear()} RawSwap. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterPill({ emoji, text }: { emoji: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium text-slate-400 bg-white/[0.03] border border-white/[0.06]">
      <span>{emoji}</span>
      {text}
    </span>
  );
}

function FooterNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block text-xs font-mono text-slate-500 hover:text-neon-green transition-colors"
    >
      {children}
    </Link>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-xs font-mono text-slate-600 hover:text-neon-green transition-colors"
    >
      {label} ↗
    </a>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-xs font-mono font-bold text-slate-400">{value}</div>
      <div className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">{label}</div>
    </div>
  );
}
