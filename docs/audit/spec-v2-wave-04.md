# Wave 04 — Pool creation — Audit Report

**Wave:** 04  
**Overall status:** **blocked** (vs spec: live Orca/Raydium pool creation)  

## Merge summary

`create-rawswap-pools.ts` only side-imports submodules; pool scripts under `scripts/pools/` are stubs relative to spec (“verify against devnet”). lp-sdk has **no** Whirlpool or Raydium SDK wiring. Environment + DB can **register** pool addresses once known.

## Agent findings

### 04.1 — create-rawswap-pools orchestration

| Verdict | **gap** | [`scripts/create-rawswap-pools.ts`](../../scripts/create-rawswap-pools.ts) |

### 04.2 — Orca splash script

| Verdict | **gap** | [`scripts/pools/orca-rawswap-sol-splash.ts`](../../scripts/pools/orca-rawswap-sol-splash.ts) — expect stub/log |

### 04.3 — Raydium cpmm script

| Verdict | **gap** | [`scripts/pools/raydium-rawswap-sol-cpmm.ts`](../../scripts/pools/raydium-rawswap-sol-cpmm.ts) |

### 04.4 — Pool constants in shared

| Verdict | **partial** | [`pools.ts`](../../packages/shared/src/constants/pools.ts) empty placeholders |

### 04.5 — API env pool registration

| Verdict | **done** | `ORCA_RAWSWAP_SOL_POOL`, `RAYDIUM_RAWSWAP_SOL_POOL` |

### 04.6 — lp-sdk alignment with W04 spec

| Verdict | **gap** | No SDK deps (see W01 01.6 / 01.7) |

### 04.7 — DB liquidity_pools seed

| Verdict | **partial** | [`scripts/seed-dev-liquidity-pools.ts`](../../scripts/seed-dev-liquidity-pools.ts) dev stubs |

### 04.8 — listConfiguredPools merge logic

| Verdict | **done** | [`apps/api/src/services/liquidity.ts`](../../apps/api/src/services/liquidity.ts) merges DB + env |

### 04.9 — Compounder pool consumers

| Verdict | **gap** | [`deposit-orca.ts`](../../apps/compounder/src/deposit-orca.ts) notes only |

### 04.10 — Risk: wrong pool address in env

| Verdict | **partial** | Pubkey parse in compounder env; API listing does not verify on-chain pool |
