# Wave 11 — NTT EVM tokens — Audit Report

**Wave:** 11  
**Overall status:** **at-risk**  

## Merge summary

`RawSwapToken` implements **minter-gated** mint/burn with **explicit non–ERC-20** caveat. **Tests** pass under Foundry. **INttToken** interface inheritance from Wormhole samples is **not** present (may be optional if manager wraps).

## Agent findings

### 11.1 — RawSwapToken.sol behavior

| Verdict | **done** | [`contracts/evm/src/RawSwapToken.sol`](../../contracts/evm/src/RawSwapToken.sol) |

### 11.2 — Forge tests

| Verdict | **done** | [`RawSwapToken.t.sol`](../../contracts/evm/test/RawSwapToken.t.sol) |

### 11.3 — ERC-20 compatibility

| Verdict | **gap** (by design) | Document bridge/wrap path |

### 11.4 — Minter governance

| Verdict | **gap** | No multisig in contract |

### 11.5 — Deployment script

| Verdict | **partial** | Check [`contracts/evm/script`](../../contracts/evm/script) for DeployToken |

### 11.6 — OpenZeppelin reuse

| Verdict | **gap** | Custom minimal token |

### 11.7 — Chain-specific addresses

| Verdict | **gap** | Not tracked in repo |

### 11.8 — NTT hub/spoke alignment

| Verdict | **partial** | Doc only |

### 11.9 — Slither / static analysis

| Verdict | **gap** | — |

### 11.10 — Supply cap

| Verdict | **gap** | None |
