export type JitoSendOptions = {
  bundleOnly?: boolean;
  encoding?: "base64" | "base58";
};

export type BundleStatus = {
  bundleId: string;
  confirmationStatus?: string;
  err?: unknown;
  landedSlot?: number;
  transactions?: string[];
};

export type InflightBundleStatus = {
  bundleId: string;
  status: string;
};
