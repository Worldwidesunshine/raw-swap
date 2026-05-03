# Wave 19 — Integration — Audit Report

**Wave:** 19  
**Overall status:** **partial**  

## Merge summary

[`docs/research/integration-wave-19.md`](../../docs/research/integration-wave-19.md) is a **manual checklist** (mostly unchecked at doc level). **Smoke tests** [`scripts/smoke-test.sh`](../../scripts/smoke-test.sh) + [`tests/smoke/`](../../tests/smoke/) cover **swap build/submit path**, health, tokens — **not** NTT round-trip, compounder, full LP cycle, EVM vault deposit.

## Agent findings

### 19.1 — Smoke script automation

| Verdict | **done** | Compose test + migrations + Vitest |

### 19.2 — Swap + fee verification in smoke

| Verdict | **partial** | Live build uses Jupiter; explicit vault balance assert unclear |

### 19.3 — Compounder in compose

| Verdict | **gap** | Not in default test stack |

### 19.4 — NTT E2E

| Verdict | **gap** | — |

### 19.5 — deBridge fulfilled flow

| Verdict | **gap** | — |

### 19.6 — LP cycle E2E

| Verdict | **gap** | — |

### 19.7 — EVM vault E2E

| Verdict | **gap** | — |

### 19.8 — docker-compose prod alignment

| Verdict | **partial** | [`infra/`](../../infra/) |

### 19.9 — Observability profile

| Verdict | **partial** | Mentioned in prod compose |

### 19.10 — Integration doc ownership

| Verdict | **partial** | Markdown checklist |
