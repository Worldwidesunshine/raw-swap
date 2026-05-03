export type ErrorCode =
  | "INVALID_REQUEST"
  | "QUOTE_FAILED"
  | "QUOTE_NOT_FOUND"
  | "QUOTE_EXPIRED"
  | "UNSUPPORTED_PAIR"
  | "INVALID_AMOUNT"
  | "INVALID_SLIPPAGE"
  | "BUILD_FAILED"
  | "BUILD_NOT_FOUND"
  | "RAW_INSTRUCTION_BUILD_FAILED"
  | "BLOCKHASH_STALE"
  | "TRANSACTION_TOO_LARGE"
  | "LOOKUP_TABLE_LOAD_FAILED"
  | "SIMULATION_FAILED"
  | "SIMULATION_TIMEOUT"
  | "USER_REJECTED_SIGNATURE"
  | "WALLET_SIGNING_FAILED"
  | "SIGNED_TX_MESSAGE_MISMATCH"
  | "UNEXPECTED_SIGNER"
  | "UNEXPECTED_PROGRAM_ID"
  | "JITO_SUBMIT_FAILED"
  | "JITO_TIMEOUT"
  | "RPC_FALLBACK_FAILED"
  | "TRANSACTION_EXPIRED"
  | "TRANSACTION_FAILED_ONCHAIN"
  | "INSUFFICIENT_FUNDS"
  | "SLIPPAGE_EXCEEDED"
  | "TOKEN_ACCOUNT_ERROR"
  | "COMPUTE_BUDGET_EXCEEDED"
  | "TOKEN_RISK_BLOCKED"
  | "UNKNOWN_EXECUTION_ERROR";

export type RawSwapErrorShape = {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
  userAction: string;
};

export const ERROR_CATALOG: Record<ErrorCode, RawSwapErrorShape> = {
  INVALID_REQUEST: {
    code: "INVALID_REQUEST",
    message: "The request payload is invalid.",
    retryable: false,
    userAction: "Correct the request fields and try again.",
  },
  QUOTE_FAILED: {
    code: "QUOTE_FAILED",
    message: "Could not obtain a quote from the route provider.",
    retryable: true,
    userAction: "Try again in a few seconds or change the amount.",
  },
  QUOTE_NOT_FOUND: {
    code: "QUOTE_NOT_FOUND",
    message: "The requested quote does not exist.",
    retryable: true,
    userAction: "Request a fresh quote.",
  },
  QUOTE_EXPIRED: {
    code: "QUOTE_EXPIRED",
    message: "The quote has expired.",
    retryable: true,
    userAction: "Request a fresh quote.",
  },
  UNSUPPORTED_PAIR: {
    code: "UNSUPPORTED_PAIR",
    message: "This token pair is not supported on this deployment.",
    retryable: false,
    userAction: "Choose supported Solana tokens and request a fresh quote.",
  },
  INVALID_AMOUNT: {
    code: "INVALID_AMOUNT",
    message: "Amount is invalid for this pair.",
    retryable: false,
    userAction: "Enter a valid positive amount in base units.",
  },
  INVALID_SLIPPAGE: {
    code: "INVALID_SLIPPAGE",
    message: "Slippage exceeds the configured maximum.",
    retryable: false,
    userAction: "Lower slippage and retry.",
  },
  BUILD_FAILED: {
    code: "BUILD_FAILED",
    message: "Failed to build the swap transaction.",
    retryable: true,
    userAction: "Refresh quote and build again.",
  },
  BUILD_NOT_FOUND: {
    code: "BUILD_NOT_FOUND",
    message: "The requested build does not exist.",
    retryable: true,
    userAction: "Create a new build from a fresh quote.",
  },
  RAW_INSTRUCTION_BUILD_FAILED: {
    code: "RAW_INSTRUCTION_BUILD_FAILED",
    message: "The routing provider did not return valid raw instructions.",
    retryable: true,
    userAction: "Request a new quote and try again.",
  },
  BLOCKHASH_STALE: {
    code: "BLOCKHASH_STALE",
    message: "The recent blockhash is no longer valid.",
    retryable: true,
    userAction: "Rebuild the transaction with a fresh quote.",
  },
  TRANSACTION_TOO_LARGE: {
    code: "TRANSACTION_TOO_LARGE",
    message: "Transaction exceeds size limits.",
    retryable: true,
    userAction: "Reduce route complexity or try a smaller swap.",
  },
  LOOKUP_TABLE_LOAD_FAILED: {
    code: "LOOKUP_TABLE_LOAD_FAILED",
    message: "Could not resolve address lookup tables for the route.",
    retryable: true,
    userAction: "Try again or adjust routing constraints.",
  },
  SIMULATION_FAILED: {
    code: "SIMULATION_FAILED",
    message: "Transaction failed during simulation.",
    retryable: false,
    userAction: "Refresh quote and try again.",
  },
  SIMULATION_TIMEOUT: {
    code: "SIMULATION_TIMEOUT",
    message: "Simulation timed out.",
    retryable: true,
    userAction: "Retry the submission.",
  },
  USER_REJECTED_SIGNATURE: {
    code: "USER_REJECTED_SIGNATURE",
    message: "User rejected the wallet signing request.",
    retryable: true,
    userAction: "Sign the transaction in your wallet to continue.",
  },
  WALLET_SIGNING_FAILED: {
    code: "WALLET_SIGNING_FAILED",
    message: "The wallet could not sign this transaction.",
    retryable: true,
    userAction: "Check your wallet connection and try again.",
  },
  SIGNED_TX_MESSAGE_MISMATCH: {
    code: "SIGNED_TX_MESSAGE_MISMATCH",
    message: "Signed transaction does not match the server build record.",
    retryable: true,
    userAction: "Request a new build. Do not modify the transaction in your wallet.",
  },
  UNEXPECTED_SIGNER: {
    code: "UNEXPECTED_SIGNER",
    message: "Unexpected signer on the signed transaction.",
    retryable: true,
    userAction: "Sign with the same wallet that requested the quote.",
  },
  UNEXPECTED_PROGRAM_ID: {
    code: "UNEXPECTED_PROGRAM_ID",
    message: "Unexpected program id in the signed transaction.",
    retryable: false,
    userAction: "Do not modify the transaction. Request a new build.",
  },
  JITO_SUBMIT_FAILED: {
    code: "JITO_SUBMIT_FAILED",
    message: "Submission to Jito block engine failed.",
    retryable: true,
    userAction: "Enable RPC fallback or retry.",
  },
  JITO_TIMEOUT: {
    code: "JITO_TIMEOUT",
    message: "Jito submission timed out.",
    retryable: true,
    userAction: "Check signature status or use RPC fallback.",
  },
  RPC_FALLBACK_FAILED: {
    code: "RPC_FALLBACK_FAILED",
    message: "RPC fallback submission failed.",
    retryable: true,
    userAction: "Try again or use a different RPC endpoint.",
  },
  TRANSACTION_EXPIRED: {
    code: "TRANSACTION_EXPIRED",
    message: "The transaction expired before confirmation.",
    retryable: true,
    userAction: "Rebuild with a fresh blockhash.",
  },
  TRANSACTION_FAILED_ONCHAIN: {
    code: "TRANSACTION_FAILED_ONCHAIN",
    message: "The transaction failed on-chain.",
    retryable: true,
    userAction: "Review simulation logs and refresh the quote.",
  },
  INSUFFICIENT_FUNDS: {
    code: "INSUFFICIENT_FUNDS",
    message: "Insufficient funds for this swap and fees.",
    retryable: false,
    userAction: "Fund your wallet and retry.",
  },
  SLIPPAGE_EXCEEDED: {
    code: "SLIPPAGE_EXCEEDED",
    message: "Price moved beyond slippage tolerance.",
    retryable: true,
    userAction: "Increase slippage slightly or refresh quote.",
  },
  TOKEN_ACCOUNT_ERROR: {
    code: "TOKEN_ACCOUNT_ERROR",
    message: "Token account state is not ready for this swap.",
    retryable: true,
    userAction: "Ensure ATA exists and has sufficient balance.",
  },
  COMPUTE_BUDGET_EXCEEDED: {
    code: "COMPUTE_BUDGET_EXCEEDED",
    message: "Compute budget was exceeded.",
    retryable: true,
    userAction: "Try a more conservative urgency profile.",
  },
  TOKEN_RISK_BLOCKED: {
    code: "TOKEN_RISK_BLOCKED",
    message: "Token risk checks blocked this transaction.",
    retryable: false,
    userAction: "Use an allowlisted token only.",
  },
  UNKNOWN_EXECUTION_ERROR: {
    code: "UNKNOWN_EXECUTION_ERROR",
    message: "An unknown execution error occurred.",
    retryable: false,
    userAction: "Contact support with your execution id.",
  },
};
