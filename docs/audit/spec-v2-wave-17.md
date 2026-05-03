# Wave 17 — EVM fee vault — Audit Report

**Wave:** 17  
**Overall status:** **at-risk**  

## Merge summary

[`FeeVault.sol`](../../contracts/evm/src/FeeVault.sol) is an **ERC-4626-style shell** only (stores `asset`); **FeeSplitter** stores `buybackVault` — **no** deposit/mint/redeem, **no** LuxFi BridgeVault parity. **Tests** exist per prior work.

## Agent findings

### 17.1 — FeeVault ERC-4626 completeness

| Verdict | **gap** | Explicitly non-functional vault |

### 17.2 — FeeSplitter behavior

| Verdict | **partial** | Immutable sink reference |

### 17.3 — OpenZeppelin ERC4626 inheritance

| Verdict | **gap** | README points to future OZ |

### 17.4 — 12/4 split on EVM

| Verdict | **gap** | Split lives in Solana fee path; EVM splitter not wired |

### 17.5 — Upgradeability

| Verdict | **gap** | Immutable contracts |

### 17.6 — Foundry tests

| Verdict | **done** | `FeeVault.t.sol` etc. |

### 17.7 — Deployment script

| Verdict | **gap** | Check script folder |

### 17.8 — Asset whitelist

| Verdict | **gap** | Single asset ctor |

### 17.9 — Emergency pause

| Verdict | **gap** | — |

### 17.10 — Spec “LuxFi adaptation”

| Verdict | **gap** | Document roadmap only |
