import type { SwapToken } from "./token.js";

export type QuoteRequest = {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps: number;
  userPublicKey: string;
};

export type RouteSummary = {
  venues: string[];
  hops: number;
};

export type QuoteResponse = {
  quoteId: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  minimumOutAmount: string;
  priceImpactPct: string;
  expiresAt: string;
  routeSummary: RouteSummary;
  inputToken: SwapToken;
  outputToken: SwapToken;
  inAmountUi: string;
  outAmountUi: string;
  minimumOutAmountUi: string;
};

export type QuoteRecord = {
  id: string;
  userPublicKey: string;
  inputMint: string;
  outputMint: string;
  inputAmount: string;
  expectedOutputAmount: string;
  minimumOutputAmount: string;
  slippageBps: number;
  priceImpactPct: string | null;
  routeJson: unknown;
  provider: string;
  createdAt: Date;
  expiresAt: Date;
};
