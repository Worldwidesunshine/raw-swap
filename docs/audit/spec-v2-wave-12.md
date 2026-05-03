# Wave 12 — NTT EVM managers — Audit Report

**Wave:** 12  
**Overall status:** **blocked**  

## Merge summary

**No** `NttManager` / Wormhole transceiver Solidity in [`contracts/evm/src`](../../contracts/evm/src) aside from token + fee stubs. **[`deploy-ntt-evm.ts`](../../scripts/deploy-ntt-evm.ts)** is a one-line stub.

## Agent findings

### 12.1 — NttManager contract

| Verdict | **gap** | Not present |

### 12.2 — WormholeTransceiver binding

| Verdict | **gap** | — |

### 12.3 — deploy-ntt-evm script

| Verdict | **gap** | Console only |

### 12.4 — Foundry deploy script for manager

| Verdict | **gap** | Verify `script/` folder |

### 12.5 — ABI export for web

| Verdict | **gap** | — |

### 12.6 — Chain ID mapping

| Verdict | **partial** | Research doc |

### 12.7 — Relayer config

| Verdict | **gap** | — |

### 12.8 — Upgrade path

| Verdict | **gap** | — |

### 12.9 — Access control doc

| Verdict | **partial** | evm README |

### 12.10 — Cross-chain message tests

| Verdict | **gap** | — |
