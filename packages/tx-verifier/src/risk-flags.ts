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

export type SimulationLike = {
  err: unknown;
  unitsConsumed?: number;
  logs?: string[];
};

type PatternFlag = {
  flag: RiskFlag;
  patterns: RegExp[];
};

const PATTERN_FLAGS: PatternFlag[] = [
  {
    flag: "ROUTE_PRICE_MOVED",
    patterns: [
      /\bprice (?:moved|changed)\b/i,
      /\broute (?:is )?(?:stale|expired|changed)\b/i,
      /\bout amount (?:changed|reduced)\b/i,
    ],
  },
  {
    flag: "SLIPPAGE_TOO_HIGH",
    patterns: [
      /\bslippage\b/i,
      /\bprice impact too high\b/i,
      /\bexceeds (?:the )?slippage tolerance\b/i,
    ],
  },
  {
    flag: "TOKEN_ACCOUNT_MISSING",
    patterns: [
      /\bassociated token account\b.*\b(?:missing|not found|does not exist)\b/i,
      /\btoken account\b.*\b(?:missing|not found|does not exist)\b/i,
      /\bcould not find account\b/i,
      /\binvalid account data for instruction\b/i,
      /\buninitialized account\b/i,
    ],
  },
  {
    flag: "BLOCKHASH_STALE",
    patterns: [
      /\bblockhash not found\b/i,
      /\bblock height exceeded\b/i,
      /\btransaction expired\b/i,
      /\blast valid block height\b/i,
    ],
  },
  {
    flag: "UNKNOWN_TOKEN",
    patterns: [
      /\bunknown token\b/i,
      /\bunsupported mint\b/i,
      /\btoken .* not (?:supported|allowlisted|tradable)\b/i,
      /\btoken risk checks blocked\b/i,
    ],
  },
  {
    flag: "TRANSFER_TAX_DETECTED",
    patterns: [
      /\btransfer fee\b/i,
      /\btransfer tax\b/i,
      /\bwithheld fee\b/i,
    ],
  },
  {
    flag: "FREEZE_AUTHORITY_PRESENT",
    patterns: [
      /\bfreeze authority\b/i,
      /\baccount is frozen\b/i,
      /\bfrozen token\b/i,
    ],
  },
  {
    flag: "MINT_AUTHORITY_PRESENT",
    patterns: [
      /\bmint authority\b/i,
      /\btoken mint can still mint\b/i,
    ],
  },
  {
    flag: "TRANSFER_HOOK_PRESENT",
    patterns: [
      /\btransfer hook\b/i,
      /\bhook program\b/i,
    ],
  },
  {
    flag: "PERMANENT_DELEGATE_PRESENT",
    patterns: [
      /\bpermanent delegate\b/i,
      /\bdelegate authority\b/i,
    ],
  },
  {
    flag: "MEMO_REQUIRED",
    patterns: [
      /\bmemo required\b/i,
      /\bmissing memo\b/i,
      /\bplease provide memo\b/i,
    ],
  },
  {
    flag: "UNSUPPORTED_TOKEN_2022_EXTENSION",
    patterns: [
      /\btoken-?2022\b.*\b(?:unsupported|forbidden|blocked)\b/i,
      /\bunsupported extension\b/i,
      /\bextension (?:is )?not supported\b/i,
    ],
  },
  {
    flag: "UNEXPECTED_PROGRAM_ID",
    patterns: [
      /\bincorrect program id\b/i,
      /\binvalid program id\b/i,
      /\bprogram .* not allowed\b/i,
      /\bunexpected program\b/i,
    ],
  },
  {
    flag: "UNEXPECTED_SIGNER",
    patterns: [
      /\bmissing required signature\b/i,
      /\bunknown signer\b/i,
      /\bunauthorized signer\b/i,
      /\bsigner privilege escalated\b/i,
    ],
  },
  {
    flag: "MESSAGE_HASH_MISMATCH",
    patterns: [
      /\bmessage hash mismatch\b/i,
      /\bcompiled message mismatch\b/i,
      /\bsigned transaction does not match\b/i,
    ],
  },
];

function describeUnknown(value: unknown): string {
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function classifyRiskFlags(sim: SimulationLike): RiskFlag[] {
  const flags = new Set<RiskFlag>();

  if (sim.err) {
    flags.add("SIMULATION_FAILED");
  }
  if ((sim.unitsConsumed ?? 0) > 1_200_000) {
    flags.add("HIGH_COMPUTE_USAGE");
  }

  const haystack = [describeUnknown(sim.err), ...(sim.logs ?? [])]
    .filter(Boolean)
    .join("\n");

  for (const { flag, patterns } of PATTERN_FLAGS) {
    if (patterns.some((pattern) => pattern.test(haystack))) {
      flags.add(flag);
    }
  }

  return [...flags];
}
