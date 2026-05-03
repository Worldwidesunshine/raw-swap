export type ExecutionStatus =
  | "created"
  | "quoted"
  | "built"
  | "awaiting_signature"
  | "signed"
  | "verified"
  | "simulated"
  | "simulation_failed"
  | "submitted"
  | "fallback_submitted"
  | "bundle_submitted"
  | "landed"
  | "failed"
  | "expired"
  | "unknown"
  | "cancelled";

export type ExecutionRecord = {
  id: string;
  buildId: string;
  idempotencyKey: string | null;
  signature: string | null;
  bundleId: string | null;
  signedTransactionBase64: string | null;
  signedMessageHash: string | null;
  status: ExecutionStatus;
  submittedVia: string | null;
  submittedAt: Date | null;
  landedAt: Date | null;
  failedAt: Date | null;
  expiredAt: Date | null;
  submittedSlot: number | null;
  landedSlot: number | null;
  slotsToLand: number | null;
  sendLatencyMs: number | null;
  timeToLandMs: number | null;
  failureReason: string | null;
  errorCode: string | null;
  priorityFeeLamports: number | null;
  jitoTipLamports: number | null;
  actualOutputAmount: string | null;
  realizedSlippageBps: number | null;
  rawStatusJson: unknown;
  createdAt: Date;
  updatedAt: Date;
};

export type ExecutionEvent = {
  id: string;
  executionId: string;
  eventType: string;
  eventJson: unknown;
  createdAt: Date;
};
