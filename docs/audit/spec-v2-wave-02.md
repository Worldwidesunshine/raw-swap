# Wave 02 — Fee core — Audit Report

**Wave:** 02  
**Overall status:** **acceptable-for-stage** (core fee path implemented; product rule wSOL-only vs spec wording)  

## Merge summary

Protocol fee SOL transfers are composed **after cleanup, before Jito tip** per [`composer.ts`](../../packages/tx-composer/src/composer.ts). API applies fees when **both** vault and treasury are set and **input mint is SOL**. Disclosure, schemas, verifier fingerprint, and tests exist. Remaining gap is **spec narrative** (“swap input amount”) vs **implemented** wSOL-native-input rule.

## Agent findings

### 02.1 — protocol-fee module

| Field | Value |
|-------|--------|
| Verdict | **done** |
| Evidence | [`packages/tx-composer/src/protocol-fee.ts`](../../packages/tx-composer/src/protocol-fee.ts); [`protocol-fee.test.ts`](../../packages/tx-composer/src/protocol-fee.test.ts) |

### 02.2 — Composer ordering

| Field | Value |
|-------|--------|
| Verdict | **done** |
| Evidence | [`composer.ts`](../../packages/tx-composer/src/composer.ts) L74–90: `cleanup` → optional `protocolFeeSol` ixs → Jito tip |

### 02.3 — build.ts + submit.ts

| Field | Value |
|-------|--------|
| Verdict | **partial** |
| Severity | minor |
| Evidence | [`apps/api/src/services/build.ts`](../../apps/api/src/services/build.ts): gates `quote.inputMint === SOL_MINT` + both env keys; persists estimated fee lamports; [`submit.ts`](../../apps/api/src/services/submit.ts) reads build row (verify fingerprint alignment in sibling audit) |
| Follow-up | document wSOL-wrapped vs native if product expands |

### 02.4 — Shared schemas

| Field | Value |
|-------|--------|
| Verdict | **done** |
| Evidence | [`packages/shared/src/schemas/build.ts`](../../packages/shared/src/schemas/build.ts) `protocolFeeApplied`, lamport fields; submit schema |

### 02.5 — Risk policy

| Field | Value |
|-------|--------|
| Verdict | **done** |
| Evidence | [`config/risk-policy.json`](../../config/risk-policy.json) `maxProtocolFeeLamports`; wired in build flow |

### 02.6 — Web disclosure

| Field | Value |
|-------|--------|
| Verdict | **done** |
| Evidence | [`apps/web/src/components/swap/fee-disclosure.tsx`](../../apps/web/src/components/swap/fee-disclosure.tsx) |

### 02.7 — tx-verifier

| Field | Value |
|-------|--------|
| Verdict | **done** |
| Evidence | [`packages/tx-verifier`](../../packages/tx-verifier) fingerprint tests include `protocolFee` branches |

### 02.8 — tx-composer tests

| Field | Value |
|-------|--------|
| Verdict | **done** |
| Evidence | [`composer.test.ts`](../../packages/tx-composer/src/composer.test.ts), [`protocol-fee.test.ts`](../../packages/tx-composer/src/protocol-fee.test.ts) |

### 02.9 — API / Vitest

| Field | Value |
|-------|--------|
| Verdict | **partial** |
| Evidence | Fee-specific unit tests live in packages; smoke [`tests/smoke/build.test.ts`](../../tests/smoke/build.test.ts) exercises build path live |

### 02.10 — Spec parity (wSOL-only)

| Field | Value |
|-------|--------|
| Verdict | **gap** (documentation) |
| Severity | minor |
| Evidence | Spec says fee on “input amount”; code requires **`SOL_MINT`** match — intentional subset |
| Follow-up | doc product matrix in master audit |
