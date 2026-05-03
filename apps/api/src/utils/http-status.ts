import type { ErrorCode } from "@rawswap/shared";

/** HTTP status for API responses from catalogued error codes. */
const RAW_SWAP_STATUS: Partial<Record<ErrorCode, number>> = {
  INVALID_REQUEST: 400,
  QUOTE_FAILED: 502,
  QUOTE_NOT_FOUND: 404,
  BUILD_FAILED: 502,
  BUILD_NOT_FOUND: 404,
  RAW_INSTRUCTION_BUILD_FAILED: 502,
  BLOCKHASH_STALE: 409,
  TRANSACTION_TOO_LARGE: 422,
  LOOKUP_TABLE_LOAD_FAILED: 502,
  SIMULATION_TIMEOUT: 504,
  JITO_SUBMIT_FAILED: 502,
  JITO_TIMEOUT: 504,
  RPC_FALLBACK_FAILED: 502,
  UNKNOWN_EXECUTION_ERROR: 500,
};

export function statusCodeForRawSwapError(code: ErrorCode): number {
  return RAW_SWAP_STATUS[code] ?? 400;
}
