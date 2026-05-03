# Wave 15 — Cross-chain swaps — Audit Report

**Wave:** 15  
**Overall status:** **partial**  

## Merge summary

**Package** `@rawswap/cross-chain`: URL builder + `fetchDebridgeCreateTx`. **API**: [`routes/bridge.ts`](../../apps/api/src/routes/bridge.ts) proxies create-tx; **DB** services for transfer CRUD. **Spec** optional `@debridge-finance/dln-client` **not** in package deps — REST approach is valid subset.

## Agent findings

### 15.1 — create-tx URL helper

| Verdict | **done** | [`create-tx-url.ts`](../../packages/cross-chain/src/debridge/create-tx-url.ts) |

### 15.2 — fetch create-tx

| Verdict | **done** | [`fetch-create-tx.ts`](../../packages/cross-chain/src/debridge/fetch-create-tx.ts) |

### 15.3 — Affiliate env on API

| Verdict | **partial** | `DEBRIDGE_AFFILIATE_*` in env |

### 15.4 — Order state client

| Verdict | **gap** | [`buildOrderStateUrl`](../../packages/cross-chain/src/debridge/create-tx-url.ts) exists; no API proxy or `fetch` helper consumed by apps |

### 15.5 — dln-client npm package

| Verdict | **gap** | Not used (REST instead) |

### 15.6 — Hooks / serialized instructions

| Verdict | **gap** | Spec `dlnHook` auto-LP not implemented |

### 15.7 — cross-chain transfer persistence

| Verdict | **done** | [`routes/cross-chain.ts`](../../apps/api/src/routes/cross-chain.ts) |

### 15.8 — Rate limiting bridge route

| Verdict | **partial** | Global |

### 15.9 — Tests

| Verdict | **done** | debridge unit tests |

### 15.10 — CORS / security proxy

| Verdict | **done** | Server-side fetch |
