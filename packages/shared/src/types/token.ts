export type TokenProgram = "native" | "spl-token" | "spl-token-2022";

export type TokenConfig = {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  isNative: boolean;
  tokenProgram: TokenProgram | string;
};

export type SwapToken = {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  icon: string | null;
  isNative: boolean;
  isVerified: boolean;
  tokenProgram: string;
  organicScore: number | null;
  tags: string[];
};

export type TokenSearchResponse = {
  tokens: SwapToken[];
};

export type TokenRiskSnapshot = {
  id: string;
  mint: string;
  tokenProgram: string;
  decimals: number | null;
  freezeAuthority: string | null;
  mintAuthority: string | null;
  token2022Extensions: unknown;
  riskFlags: string[];
  source: string;
  createdAt: Date;
};
