# Wave 01 — Foundation — Audit Report

**Spec:** RawSwap Liquidity, Fees, and Cross-Chain LP — Technical Build Spec v2  
**Wave:** 01  
**Overall status:** **at-risk** (foundation tables/constants present; token + DEX SDK integration not)  

## Merge summary

Schema migration `0003`, API env knobs, fee constants, and research docs align with the **scaffold** phase of the spec. Token mint script and lp-sdk **lack** Token-2022 wiring and Orca/Raydium package dependencies. W02+ depend on W01 env/migration; those prerequisites are **done** enough to proceed.

## Agent findings

### 01.1 — Token mint script

| Field | Value |
|-------|--------|
| Verdict | **gap** |
| Severity | major |
| Evidence | [`scripts/create-rawswap-token.ts`](../../scripts/create-rawswap-token.ts): comments reference Token-2022 ix sequence; implementation only `Connection` + `Keypair.generate` + `getVersion` — no `@solana/spl-token` / metadata ix |
| Follow-up | implementation |

### 01.2 — Shared constants

| Field | Value |
|-------|--------|
| Verdict | **done** |
| Severity | — |
| Evidence | [`packages/shared/src/constants/fee.ts`](../../packages/shared/src/constants/fee.ts) `PROTOCOL_FEE_BPS=16`, `BUYBACK=12`, `TREASURY=4`; [`mints.ts`](../../packages/shared/src/constants/mints.ts) `RAWSWAP_MINT_PLACEHOLDER`; [`pools.ts`](../../packages/shared/src/constants/pools.ts) placeholders for Orca/Raydium |
| Follow-up | update mint/pool constants after live deployment |

### 01.3 — DB migration

| Field | Value |
|-------|--------|
| Verdict | **done** |
| Severity | — |
| Evidence | [`apps/api/src/db/migrations/0003_liquidity_and_fees.sql`](../../apps/api/src/db/migrations/0003_liquidity_and_fees.sql): `executions` + `transaction_builds` fee columns; `protocol_fee_deployments`, `liquidity_pools`, `lp_positions`, `cross_chain_transfers`, `evm_liquidity_pools`, `rewards_epochs` |
| Follow-up | none |

### 01.4 — API env

| Field | Value |
|-------|--------|
| Verdict | **partial** |
| Severity | minor |
| Evidence | [`apps/api/src/env.ts`](../../apps/api/src/env.ts): `PROTOCOL_FEE_VAULT`, `TREASURY_WALLET`, pool envs, `LP_DEV_STUB_LIQUIDITY_TX`, `RAWSWAP_MINT`, deBridge affiliate — stricter pubkey length (32–44) vs spec “optional string” |
| Follow-up | doc-only (intentional tightening) |

### 01.5 — Fee math

| Field | Value |
|-------|--------|
| Verdict | **done** |
| Severity | — |
| Evidence | [`packages/shared/src/utils/fee-math.ts`](../../packages/shared/src/utils/fee-math.ts) + [`fee-math.test.ts`](../../packages/shared/src/utils/fee-math.test.ts) |
| Follow-up | none |

### 01.6 — lp-sdk Orca

| Field | Value |
|-------|--------|
| Verdict | **gap** |
| Severity | blocker (for W04/W07 real txs) |
| Evidence | [`packages/lp-sdk/package.json`](../../packages/lp-sdk/package.json): no `@orca-so/whirlpools-sdk`; [`orca.ts`](../../packages/lp-sdk/src/orca.ts): stub fetch + describe notes only |
| Follow-up | implementation |

### 01.7 — lp-sdk Raydium

| Field | Value |
|-------|--------|
| Verdict | **gap** |
| Severity | blocker (for W04/W07 real txs) |
| Evidence | No `raydium-sdk-v2` dependency; [`raydium.ts`](../../packages/lp-sdk/src/raydium.ts): stub |
| Follow-up | implementation |

### 01.8 — Compounder scaffold

| Field | Value |
|-------|--------|
| Verdict | **partial** |
| Severity | — |
| Evidence | [`apps/compounder/`](../../apps/compounder/): package, Dockerfile, `index.ts` loop, [`env.ts`](../../apps/compounder/src/env.ts), tests for env |
| Follow-up | implementation of buyback/deposit (W05) |

### 01.9 — NTT research

| Field | Value |
|-------|--------|
| Verdict | **partial** |
| Severity | — |
| Evidence | [`docs/research/wormhole-ntt.md`](../../docs/research/wormhole-ntt.md) — checklist-style; no automated verification |
| Follow-up | keep doc updated as CLI changes |

### 01.10 — deBridge research

| Field | Value |
|-------|--------|
| Verdict | **partial** |
| Severity | — |
| Evidence | [`docs/research/debridge-dln.md`](../../docs/research/debridge-dln.md) |
| Follow-up | align with [`packages/cross-chain`](../../packages/cross-chain) implementation (W15) |

## Risks

Orca/Raydium absence blocks **spec-perfect** pool creation and LP tx building until packages land.
