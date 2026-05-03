export type RiskFlag =
  | "SIMULATION_FAILED"
  | "HIGH_COMPUTE_USAGE"
  | "ROUTE_PRICE_MOVED"
  | "SLIPPAGE_TOO_HIGH"
  | "TOKEN_ACCOUNT_MISSING"
  | "BLOCKHASH_STALE"
  | "UNKNOWN_TOKEN"
  | "TRANSFER_TAX_DETECTED"
  | "FREEZE_AUTHORITY_PRESENT"
  | "MINT_AUTHORITY_PRESENT"
  | "TRANSFER_HOOK_PRESENT"
  | "PERMANENT_DELEGATE_PRESENT"
  | "MEMO_REQUIRED"
  | "UNSUPPORTED_TOKEN_2022_EXTENSION"
  | "UNEXPECTED_PROGRAM_ID"
  | "UNEXPECTED_SIGNER"
  | "MESSAGE_HASH_MISMATCH";

export type SimulationResult = {
  simulationId: string;
  ok: boolean;
  logs: string[];
  unitsConsumed: number | null;
  err: unknown;
  accounts: unknown[];
  expectedOutAmount: string | null;
  riskFlags: RiskFlag[];
};
