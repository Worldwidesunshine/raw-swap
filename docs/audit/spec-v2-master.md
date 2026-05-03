# Spec v2 vs codebase — master audit summary

**Spec:** RawSwap Liquidity, Fees, and Cross-Chain LP — Technical Build Spec v2  
**Audit location:** [`docs/audit/`](.)  
**Verdict:** The codebase is a **strong partial implementation**: swap path, fee core (SOL), DB schema, LP API/UI scaffolds, cross-chain REST helpers, and CI/smoke are in place. **Mainnet-complete** NTT, real LP SDK txs, compounder automation, EVM vault/pools per LuxFi pattern, and rewards are **not** done.

## Wave rollup

| Wave | Theme | Overall status |
|------|--------|----------------|
| [W01](spec-v2-wave-01.md) | Foundation | at-risk |
| [W02](spec-v2-wave-02.md) | Fee core | acceptable-for-stage |
| [W03](spec-v2-wave-03.md) | Token creation | at-risk |
| [W04](spec-v2-wave-04.md) | Pool creation | blocked |
| [W05](spec-v2-wave-05.md) | Compounder core | blocked |
| [W06](spec-v2-wave-06.md) | Compounder polish | at-risk |
| [W07](spec-v2-wave-07.md) | LP API | at-risk |
| [W08](spec-v2-wave-08.md) | LP UI foundation | acceptable-for-stage |
| [W09](spec-v2-wave-09.md) | LP UI polish | at-risk |
| [W10](spec-v2-wave-10.md) | NTT Solana | blocked |
| [W11](spec-v2-wave-11.md) | NTT EVM token | at-risk |
| [W12](spec-v2-wave-12.md) | NTT EVM managers | blocked |
| [W13](spec-v2-wave-13.md) | NTT peers | blocked |
| [W14](spec-v2-wave-14.md) | Bridge UI | partial |
| [W15](spec-v2-wave-15.md) | Cross-chain swaps | partial |
| [W16](spec-v2-wave-16.md) | EVM LP pools | blocked |
| [W17](spec-v2-wave-17.md) | EVM fee vault | at-risk |
| [W18](spec-v2-wave-18.md) | Rewards | blocked |
| [W19](spec-v2-wave-19.md) | Integration | partial |
| [W20](spec-v2-wave-20.md) | Hardening | partial |

## MVP vs mainnet-ready (blocker list)

**Acceptable for an MVP demo** (with caveats documented):

- Jupiter swap + protocol fee on **SOL input** with vault + treasury configured (W02).
- LP **discovery + previews + UI** where **POST** may **501** or **dev stub** only (W07–08).
- Bridge **proxy + transfer CRUD + UI** without full DLN lifecycle (W14–15).
- CI + unit/smoke tests as configured (W19–20 partial).

**Mainnet / spec-complete blockers** (non-exhaustive):

1. **lp-sdk:** Add Orca Whirlpool + Raydium CPMM SDKs; replace stubs with real unsigned transactions (W01, W04, W07).
2. **Compounder:** Real vault polling, Jupiter buyback execution, signed LP deposits (W05–06).
3. **Solana token:** Complete Token-2022 mint script or operational runbook (W03).
4. **NTT:** Executable Solana + EVM deploy + peer registration; manager contracts (W10–13).
5. **EVM:** Production ERC-4626 (or approved alternate), pool integrations, deployed addresses (W16–17).
6. **Rewards:** Programs + API + claims (W18).
7. **Integration proofs:** E2E checklist items in [`integration-wave-19.md`](../research/integration-wave-19.md) (W19).
8. **Security process:** Signer custody, dependency/supply review, gas/CU profiling artifacts (W20).

## Traceability matrix

Machine-readable export: [`traceability-matrix.csv`](traceability-matrix.csv).

| Req ID | Requirement (abbrev) | Status | Primary evidence |
|--------|----------------------|--------|------------------|
| F-01 | Protocol fee 16 bps, 12+4 split | done | `packages/shared/src/constants/fee.ts`, `fee-math.ts` |
| F-02 | Fee ixs after cleanup before Jito tip | done | `packages/tx-composer/src/composer.ts` |
| F-03 | Fee only when vault+tasury set | done | `apps/api/src/services/build.ts` |
| F-04 | SOL input mint gate for protocol fee | partial | `build.ts` `SOL_MINT` — document vs “any input” |
| DB-01 | Migration 0003 tables/columns | done | `0003_liquidity_and_fees.sql` |
| LP-01 | Orca SDK in lp-sdk | gap | `packages/lp-sdk/package.json` |
| LP-02 | Raydium SDK in lp-sdk | gap | same |
| LP-03 | LP POST returns real txs | gap | stub/501 `routes/liquidity.ts` |
| CMP-01 | Compounder pipeline | gap | `monitor.ts`, `buyback.ts` stubs |
| XCH-01 | deBridge create-tx | done | `packages/cross-chain`, `routes/bridge.ts` |
| XCH-02 | Order state polling API | gap | URL helper only |
| XCH-03 | dlnHook auto-LP | gap | — |
| NTT-01 | Solana deploy script | gap | `deploy-ntt-solana.ts` |
| NTT-02 | EVM manager contracts | gap | `contracts/evm` |
| NTT-03 | Peer registration | gap | `register-ntt-peers.ts` |
| EVM-01 | RawSwapToken | partial | non-standard ERC |
| EVM-02 | ERC-4626 fee vault | gap | `FeeVault` shell |
| EVM-03 | EVM AMM pools | gap | table only |
| RWD-01 | Rewards implementation | gap | doc + schema |
| INT-01 | Full E2E checklist | gap | `integration-wave-19.md` |
| OPS-01 | Hardening artifacts | partial | CI + doc |

## How to re-run

1. Copy [`WAVE_REPORT_TEMPLATE.md`](WAVE_REPORT_TEMPLATE.md) if charters change.  
2. Re-verify high-churn paths: `build.ts`, `liquidity.ts`, `composer.ts`, `contracts/evm`.  
3. Update this master + CSV in the same PR as major feature work.
