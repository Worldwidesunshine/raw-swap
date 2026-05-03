import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Raw Swap — Bare-Metal Solana Execution",
  description: "Self-custodial Solana token swaps with Jupiter routing and Jito-aware execution.",
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
