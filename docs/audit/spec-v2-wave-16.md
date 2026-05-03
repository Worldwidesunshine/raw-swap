# Wave 16 — EVM LP pools — Audit Report

**Wave:** 16  
**Overall status:** **blocked**  

## Merge summary

**DB table** `evm_liquidity_pools` exists. **No** Uniswap V3 / Pancake / Velodrome pool deployment scripts or Solidity in-repo beyond **README** guidance. **Spec** universe of EVM DEXes **not** implemented.

## Agent findings

### 16.1 — evm_liquidity_pools migration

| Verdict | **done** | [`0003_liquidity_and_fees.sql`](../../apps/api/src/db/migrations/0003_liquidity_and_fees.sql) |

### 16.2 — Foundry pool contracts

| Verdict | **gap** | None |

### 16.3 — Deployment scripts per chain

| Verdict | **gap** | — |

### 16.4 — Router integration

| Verdict | **gap** | — |

### 16.5 — README accuracy

| Verdict | **partial** | [`contracts/evm/README.md`](../../contracts/evm/README.md) |

### 16.6 — API surface for EVM pools

| Verdict | **gap** | No route dedicated |

### 16.7 — Fee tier selection

| Verdict | **gap** | — |

### 16.8 — Oracle / pricing

| Verdict | **gap** | — |

### 16.9 — Liquidity mining hook

| Verdict | **gap** | Tied to W18 |

### 16.10 — Gas benchmarks

| Verdict | **gap** | hardening doc only |
