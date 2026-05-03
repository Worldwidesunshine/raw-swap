export type BlockhashInfo = {
  blockhash: string;
  lastValidBlockHeight: number;
};

export type SignatureStatus = {
  signature: string;
  confirmationStatus?: string | null;
  err?: unknown;
  slot?: number | null;
};

export type SimOptions = {
  sigVerify?: boolean;
  commitment?: string;
};
