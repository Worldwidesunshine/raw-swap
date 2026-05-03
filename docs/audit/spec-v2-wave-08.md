# Wave 08 — LP UI foundation — Audit Report

**Wave:** 08  
**Overall status:** **acceptable-for-stage**  

## Merge summary

`/liquidity` route, hooks, and deposit/withdraw forms exist with preview flows and API wiring. Full “position management” and real sign-and-submit of LP txs are **blocked** by API 501 / stub.

## Agent findings

### 08.1 — /liquidity page

| Verdict | **done** | [`apps/web/src/app/liquidity/page.tsx`](../../apps/web/src/app/liquidity/page.tsx) |

### 08.2 — use-liquidity hook

| Verdict | **done** | [`apps/web/src/hooks/use-liquidity.ts`](../../apps/web/src/hooks/use-liquidity.ts) |

### 08.3 — Pool list UX

| Verdict | **partial** | Depends on API data quality |

### 08.4 — Deposit form

| Verdict | **done** | [`components/liquidity/deposit-form.tsx`](../../apps/web/src/components/liquidity/deposit-form.tsx) |

### 08.5 — Withdraw form

| Verdict | **done** | [`withdraw-form.tsx`](../../apps/web/src/components/liquidity/withdraw-form.tsx) |

### 08.6 — Wallet connection assumption

| Verdict | **partial** | Align with app layout wallet provider |

### 08.7 — api-client liquidity endpoints

| Verdict | **done** | [`apps/web/src/lib/api-client.ts`](../../apps/web/src/lib/api-client.ts) (verify paths match API) |

### 08.8 — Error mapping

| Verdict | **partial** | `formatApiRequestError` pattern from prior UX work |

### 08.9 — Loading states

| Verdict | **done** | aria-busy patterns per bridge/liquidity polish |

### 08.10 — Routing / nav

| Verdict | **partial** | Header links (verify in layout) |
