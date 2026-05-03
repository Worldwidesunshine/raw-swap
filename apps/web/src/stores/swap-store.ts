import { create } from "zustand";
import type { QuoteResponse, SwapToken, UserReview } from "@rawswap/shared";
import {
  DEFAULT_INPUT_TOKEN,
  DEFAULT_OUTPUT_TOKEN,
  oneTokenUiAmount,
} from "@/lib/tokens";

type ResettableField = "amount" | "slippageBps" | "urgency" | "executionMode";

const RESETTABLE_FIELDS = new Set<ResettableField>([
  "amount",
  "slippageBps",
  "urgency",
  "executionMode",
]);

function clearedExecutionState() {
  return {
    quoteId: null,
    quotePayload: null,
    buildId: null,
    executionId: null,
    executionAccessToken: null,
    userReview: null,
  };
}

export type SwapState = {
  inputToken: SwapToken;
  outputToken: SwapToken;
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps: number;
  urgency: "low" | "normal" | "high";
  executionMode: "jito_single_tx" | "fallback_rpc";
  quoteId: string | null;
  quotePayload: QuoteResponse | null;
  buildId: string | null;
  executionId: string | null;
  executionAccessToken: string | null;
  userReview: UserReview | null;
  setField: <K extends ResettableField>(
    k: K,
    v: SwapState[K],
  ) => void;
  setQuote: (payload: QuoteResponse) => void;
  setExecution: (
    buildId: string | null,
    executionId: string | null,
    executionAccessToken: string | null,
    userReview: UserReview | null,
  ) => void;
  setInputToken: (token: SwapToken) => void;
  setOutputToken: (token: SwapToken) => void;
  flipTokens: () => void;
};

export const useSwapStore = create<SwapState>((set) => ({
  inputToken: DEFAULT_INPUT_TOKEN,
  outputToken: DEFAULT_OUTPUT_TOKEN,
  inputMint: DEFAULT_INPUT_TOKEN.mint,
  outputMint: DEFAULT_OUTPUT_TOKEN.mint,
  amount: oneTokenUiAmount(),
  slippageBps: 50,
  urgency: "normal",
  executionMode: "jito_single_tx",
  quoteId: null,
  quotePayload: null,
  buildId: null,
  executionId: null,
  executionAccessToken: null,
  userReview: null,
  setField: (k, v) =>
    set((state) => ({
      ...state,
      [k]: v,
      ...(RESETTABLE_FIELDS.has(k) ? clearedExecutionState() : {}),
    })),
  setQuote: (payload) =>
    set({
      ...clearedExecutionState(),
      quoteId: payload.quoteId,
      quotePayload: payload,
    }),
  setExecution: (buildId, executionId, executionAccessToken, userReview) =>
    set({ buildId, executionId, executionAccessToken, userReview }),
  setInputToken: (token) =>
    set((state) => ({
      ...state,
      inputToken: token,
      inputMint: token.mint,
      outputToken: token.mint === state.outputToken.mint ? state.inputToken : state.outputToken,
      outputMint: token.mint === state.outputToken.mint ? state.inputToken.mint : state.outputMint,
      amount: oneTokenUiAmount(),
      ...clearedExecutionState(),
    })),
  setOutputToken: (token) =>
    set((state) => ({
      ...state,
      inputToken: token.mint === state.inputToken.mint ? state.outputToken : state.inputToken,
      inputMint: token.mint === state.inputToken.mint ? state.outputToken.mint : state.inputMint,
      outputToken: token,
      outputMint: token.mint,
      amount: token.mint === state.inputToken.mint ? oneTokenUiAmount() : state.amount,
      ...clearedExecutionState(),
    })),
  flipTokens: () =>
    set((state) => ({
      ...state,
      inputToken: state.outputToken,
      outputToken: state.inputToken,
      inputMint: state.outputMint,
      outputMint: state.inputMint,
      amount: oneTokenUiAmount(),
      ...clearedExecutionState(),
    })),
}));
