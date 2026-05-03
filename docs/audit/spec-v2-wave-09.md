# Wave 09 — LP UI polish — Audit Report

**Wave:** 09  
**Overall status:** **at-risk** vs full spec  

## Merge summary

Spec asks for **harvest fees**, **advanced position management**, and polished empty/error states. Current UI covers **core forms + preview**; harvest and production LP signing are **deferred**.

## Agent findings

### 09.1 — a11y labels

| Verdict | **partial** | Bridge gained labels; apply same bar to liquidity |

### 09.2 — Mobile layout

| Verdict | **partial** | Not formally audited in this pass |

### 09.3 — 501 / stub messaging

| Verdict | **partial** | User-facing copy for “not implemented” |

### 09.4 — Position list / drill-down

| Verdict | **gap** | API has positions; UI depth unverified |

### 09.5 — Harvest flow

| Verdict | **gap** | Not in spec implementation |

### 09.6 — Transaction history

| Verdict | **gap** | — |

### 09.7 — Slippage / deadline controls for LP

| Verdict | **gap** | Preview optional `amount` only |

### 09.8 — i18n

| Verdict | **gap** | English-only |

### 09.9 — Theme consistency

| Verdict | **done** | Neon/tailwind pattern |

### 09.10 — E2E tests

| Verdict | **gap** | No Playwright for liquidity |
