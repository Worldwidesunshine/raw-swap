# Wave 10 — NTT Solana — Audit Report

**Wave:** 10  
**Overall status:** **blocked**  

## Merge summary

**Script** [`deploy-ntt-solana.ts`](../../scripts/deploy-ntt-solana.ts) is a **console stub**. **Research doc** exists. **Zod** deployment file tests in [`packages/cross-chain`](../../packages/cross-chain) validate JSON shape only.

## Agent findings

### 10.1 — deploy-ntt-solana executable

| Verdict | **gap** | Stub log line |

### 10.2 — ntt package layout

| Verdict | **partial** | [`packages/cross-chain/src/ntt`](../../packages/cross-chain/src/ntt) schema + tests |

### 10.3 — wormhole-ntt.md completeness

| Verdict | **partial** | [`docs/research/wormhole-ntt.md`](../../docs/research/wormhole-ntt.md) |

### 10.4 — CLI version pinning

| Verdict | **gap** | Not in repo |

### 10.5 — Solana locking mode evidence

| Verdict | **gap** | No `deployment.json` artifact |

### 10.6 — Rate limits in config

| Verdict | **gap** | — |

### 10.7 — CI for NTT

| Verdict | **gap** | — |

### 10.8 — Security review transceiver

| Verdict | **gap** | — |

### 10.9 — RPC / key handling

| Verdict | **gap** | — |

### 10.10 — Integration with RAWSWAP_MINT

| Verdict | **gap** | Mint not created on-chain from W03 |
