import type {
  BuildResponse,
  CrossChainTransferRecord,
  LiquidityPoolsResponse,
  LiquidityPreviewResponse,
  QuoteResponse,
  SubmitResponse,
  SwapToken,
  WalletSessionRequest,
  WalletSessionResponse,
} from "@rawswap/shared";
import { API_BASE } from "./constants";

type ApiErrorBody = {
  message?: string;
  code?: string;
  userAction?: string;
  details?: Record<string, unknown>;
};

export class ApiRequestError extends Error {
  readonly code?: string;
  readonly status: number;
  readonly userAction?: string;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      code?: string;
      status: number;
      userAction?: string;
      details?: Record<string, unknown>;
    },
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.code = options.code;
    this.status = options.status;
    this.userAction = options.userAction;
    this.details = options.details;
  }
}

/** Single-line message for inline UI; includes `userAction` when present. */
export function formatApiRequestError(err: ApiRequestError): string {
  const msg = err.message?.trim() || `HTTP ${err.status}`;
  if (err.userAction?.trim()) {
    return `${msg} — ${err.userAction.trim()}`;
  }
  return msg;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    if (body) {
      let parsed: ApiErrorBody | null = null;
      try {
        parsed = JSON.parse(body) as ApiErrorBody;
      } catch {
        parsed = null;
      }
      throw new ApiRequestError(parsed?.message ?? parsed?.code ?? body, {
        code: parsed?.code,
        status: res.status,
        userAction: parsed?.userAction,
        details: parsed?.details,
      });
    }
    throw new ApiRequestError(res.statusText, { status: res.status });
  }
  return res.json() as Promise<T>;
}

function withExecutionToken(token: string): HeadersInit {
  return { "x-execution-token": token };
}

function withWalletSessionToken(token: string): HeadersInit {
  return { "x-wallet-session-token": token };
}

export type LiquidityVenue = "orca_whirlpool" | "raydium_cpmm";

export type LiquidityActionBody = {
  poolAddress: string;
  venue: LiquidityVenue;
  /** UI placeholder until amounts are wired server-side */
  amount: string;
  /** Connected wallet base58 — required for production deposit/withdraw flows */
  userPublicKey?: string;
};

export type CrossChainTransferCreateInput = {
  provider: string;
  orderId?: string;
  sourceChain: string;
  destChain: string;
  status: string;
  amountIn?: string;
  amountOut?: string;
  mintIn?: string;
  mintOut?: string;
  walletPublicKey?: string;
  metadata?: Record<string, unknown>;
};

export function getCrossChainTransfers(
  query: { limit?: number; wallet?: string },
  walletSessionToken: string,
) {
  const params = new URLSearchParams();
  if (query?.limit != null) params.set("limit", String(query.limit));
  if (query?.wallet) params.set("wallet", query.wallet);
  const qs = params.toString();
  return apiFetch<{ transfers: CrossChainTransferRecord[] }>(
    `/api/cross-chain/transfers${qs ? `?${qs}` : ""}`,
    { headers: withWalletSessionToken(walletSessionToken) },
  );
}

export function postCrossChainTransfer(
  body: CrossChainTransferCreateInput,
  walletSessionToken: string,
) {
  return apiFetch<CrossChainTransferRecord>("/api/cross-chain/transfers", {
    method: "POST",
    body: JSON.stringify(body),
    headers: withWalletSessionToken(walletSessionToken),
  });
}

export function postLiquidityPreviewDeposit(body: LiquidityActionBody) {
  return apiFetch<LiquidityPreviewResponse>("/api/liquidity/preview-deposit", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function postLiquidityPreviewWithdraw(body: LiquidityActionBody) {
  return apiFetch<LiquidityPreviewResponse>("/api/liquidity/preview-withdraw", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function patchCrossChainTransfer(
  id: string,
  body: { status: string; metadata?: Record<string, unknown> },
  walletSessionToken: string,
) {
  return apiFetch<CrossChainTransferRecord>(`/api/cross-chain/transfers/id/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: withWalletSessionToken(walletSessionToken),
  });
}

export function postWalletSession(body: WalletSessionRequest) {
  return apiFetch<WalletSessionResponse>("/api/wallet-session", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getLiquidityPools() {
  return apiFetch<LiquidityPoolsResponse>("/api/liquidity/pools");
}

export function postLiquidityDeposit(body: LiquidityActionBody) {
  return apiFetch<unknown>("/api/liquidity/deposit", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function postLiquidityWithdraw(body: LiquidityActionBody) {
  return apiFetch<unknown>("/api/liquidity/withdraw", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function postQuote(body: unknown) {
  return apiFetch<QuoteResponse>("/api/quote", { method: "POST", body: JSON.stringify(body) });
}

export function postBuild(body: unknown) {
  return apiFetch<BuildResponse>("/api/build", { method: "POST", body: JSON.stringify(body) });
}

export async function getTokens(query = "", limit = 20) {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  params.set("limit", String(limit));
  const queryString = params.toString();
  const response = await apiFetch<{ tokens: SwapToken[] }>(
    `/api/tokens${queryString ? `?${queryString}` : ""}`,
  );
  return response.tokens;
}

export async function getTokenByMint(mint: string) {
  const tokens = await getTokens(mint, 50);
  const exactMatch = tokens.find((token) => token.mint === mint);
  if (!exactMatch) {
    throw new ApiRequestError("Token search could not resolve that mint.", {
      code: "TOKEN_NOT_FOUND",
      status: 404,
      userAction: "Paste a full Jupiter-routable SPL mint address or search by symbol.",
    });
  }
  return exactMatch;
}

export function postSubmit(body: unknown) {
  return apiFetch<SubmitResponse>("/api/submit", { method: "POST", body: JSON.stringify(body) });
}

export function getStatus(executionId: string, executionAccessToken: string) {
  return apiFetch<unknown>(`/api/status/${executionId}`, {
    headers: withExecutionToken(executionAccessToken),
  });
}

export function getReport(executionId: string, executionAccessToken: string) {
  return apiFetch<unknown>(`/api/report/${executionId}`, {
    headers: withExecutionToken(executionAccessToken),
  });
}
