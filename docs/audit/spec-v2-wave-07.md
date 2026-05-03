# Wave 07 — LP API — Audit Report

**Wave:** 07  
**Overall status:** **at-risk**  

## Merge summary

**GET** pools and positions, **preview** deposit/withdraw, and **POST** deposit/withdraw exist. **POST** returns **501** unless dev stub env and body include `userPublicKey` — not production-ready Orca/Raydium **unsigned** LP transactions per spec.

## Agent findings

### 07.1 — GET /liquidity/pools

| Verdict | **done** | [`routes/liquidity.ts`](../../apps/api/src/routes/liquidity.ts) |

### 07.2 — GET /liquidity/positions/:wallet

| Verdict | **done** | Validation on wallet length |

### 07.3 — POST preview-deposit / preview-withdraw

| Verdict | **partial** | [`previewLiquidityDeposit`](../../apps/api/src/services/liquidity.ts): `unsignedTransactionBase64: null` |

### 07.4 — POST deposit

| Verdict | **partial** | Try stub then 501 |

### 07.5 — POST withdraw

| Verdict | **partial** | Same |

### 07.6 — listConfiguredPools + DB merge

| Verdict | **done** | [`liquidity.ts`](../../apps/api/src/services/liquidity.ts) |

### 07.7 — LP_DEV_STUB_LIQUIDITY_TX

| Verdict | **partial** | Dev-only path; ensure prod `.env` docs |

### 07.8 — OpenAPI / docs plugin

| Verdict | **partial** | Manual spot-check [`swagger.ts`](../../apps/api/src/plugins/swagger.ts) if present |

### 07.9 — Unit tests

| Verdict | **done** | `liquidity.preview.test.ts`, `liquidity.deposit-withdraw.test.ts` |

### 07.10 — Abuse / rate limiting

| Verdict | **partial** | Inherits Fastify global policy |
