import { RawSwapError, type ErrorCode } from "@rawswap/shared";

type ProviderFailureCode = Extract<ErrorCode, "QUOTE_FAILED" | "BUILD_FAILED">;

type ErrorWithMetadata = Error & {
  upstreamStatus?: unknown;
  responseSnippet?: unknown;
};

const NO_ROUTE_PATTERN =
  /could not find any route|could_not_find_any_route|no route|not tradable|no liquidity|pair unsupported|market not found/i;
const INVALID_AMOUNT_PATTERN =
  /invalid amount|amount too (small|large)|minimum amount|input amount/i;

function describeUnknown(value: unknown): string {
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getMessageText(error: unknown): string {
  if (error instanceof Error) {
    const meta = error as ErrorWithMetadata;
    if (typeof meta.responseSnippet === "string" && meta.responseSnippet.length > 0) {
      return `${error.message}\n${meta.responseSnippet}`;
    }
    return error.message;
  }
  return describeUnknown(error);
}

function buildDetails(error: unknown, provider: string, action: string) {
  const details: Record<string, unknown> = { provider, action };

  if (!(error instanceof Error)) {
    details.cause = describeUnknown(error);
    return details;
  }

  const meta = error as ErrorWithMetadata;
  details.cause = `${error.name}: ${error.message}`;

  if (typeof meta.upstreamStatus === "number") {
    details.upstreamStatus = meta.upstreamStatus;
  }
  if ("cause" in error && typeof error.cause !== "undefined") {
    details.upstreamCause = describeUnknown(error.cause);
  }

  return details;
}

function maybeClassifyUserError(
  failureCode: ProviderFailureCode,
  details: Record<string, unknown>,
  messageText: string,
): RawSwapError | null {
  if (failureCode !== "QUOTE_FAILED" || details.upstreamStatus !== 400) {
    return null;
  }

  if (NO_ROUTE_PATTERN.test(messageText)) {
    return new RawSwapError("UNSUPPORTED_PAIR", {
      message: "The routing provider could not find a swap route for this token pair.",
      details,
      userAction: "Choose a different token pair or try again later.",
    });
  }

  if (INVALID_AMOUNT_PATTERN.test(messageText)) {
    return new RawSwapError("INVALID_AMOUNT", {
      message: "The routing provider rejected the requested amount for this pair.",
      details,
      userAction: "Try a different amount and request a new quote.",
    });
  }

  return null;
}

export function normalizeUpstreamError(
  error: unknown,
  failureCode: ProviderFailureCode,
  provider: string,
  action: string,
): RawSwapError {
  if (error instanceof RawSwapError) {
    return error;
  }

  const details = buildDetails(error, provider, action);
  const messageText = getMessageText(error);
  const userError = maybeClassifyUserError(failureCode, details, messageText);
  if (userError) {
    return userError;
  }

  return new RawSwapError(failureCode, {
    message: `${provider} ${action} request failed.`,
    details,
  });
}
