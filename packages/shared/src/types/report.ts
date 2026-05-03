import type { RouteSummary } from "./quote.js";

export type ExecutionReport = {
  executionId: string;
  signature: string | null;
  status: string;
  inputMint: string;
  outputMint: string;
  inputAmount: string;
  expectedOutputAmount: string;
  actualOutputAmount: string | null;
  realizedSlippageBps: number | null;
  priorityFeeLamports: number | null;
  jitoTipLamports: number | null;
  quoteMs: number | null;
  buildMs: number | null;
  simulationMs: number | null;
  sendMs: number | null;
  timeToLandMs: number | null;
  submittedSlot: number | null;
  landedSlot: number | null;
  routeSummary: RouteSummary;
};
