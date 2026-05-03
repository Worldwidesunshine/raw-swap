import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "RawSwap — Bare-Metal Solana Execution",
  description: "Self-custodial Solana token swaps with Jupiter routing, Jito MEV protection, cross-chain bridge, and liquidity staking.",
  keywords: ["solana", "dex", "swap", "jupiter", "jito", "mev protection", "defi", "rawswap"],
  openGraph: {
    title: "RawSwap — Bare-Metal Solana Execution",
    description: "Self-custodial Solana token swaps with Jupiter routing and Jito-aware execution. No wrappers. No bloat.",
    url: "https://rawswap.net",
    siteName: "RawSwap",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RawSwap — Bare-Metal Solana Execution",
    description: "Self-custodial Solana swaps via Jupiter + Jito. MEV-protected.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>
          <div className="min-h-screen flex flex-col relative">
            <Header />
            <main className="flex-1 relative z-10">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
