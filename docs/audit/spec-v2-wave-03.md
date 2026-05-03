# Wave 03 — Token creation — Audit Report

**Wave:** 03  
**Overall status:** **at-risk**  

## Merge summary

Solana Token-2022 **mint script is scaffold-only**. EVM `RawSwapToken` is a **non-standard** minter/burn token (documented), not full ERC-20 — acceptable for spoke **if** wrapped for AMMs. No evidence of completed multisig/timelock deployment in repo.

## Agent findings

### 03.1 — Solana mint script completeness

| Verdict | **gap** | [`scripts/create-rawswap-token.ts`](../../scripts/create-rawswap-token.ts) |

### 03.2 — Script dependencies in package graph

| Verdict | **gap** | Script comments suggest optional `-D` adds; not declared as runnable workspace script with full deps in root (verify `package.json` scripts if needed) |

### 03.3 — RAWSWAP_MINT constant / env

| Verdict | **partial** | Placeholder in shared; optional `RAWSWAP_MINT` on API env |

### 03.4 — EVM token vs INttToken

| Verdict | **partial** | [`RawSwapToken.sol`](../../contracts/evm/src/RawSwapToken.sol): `minter` pattern fits manager model; not interface-inheritance from Wormhole sample |

### 03.5 — Multisig / treasury process

| Verdict | **gap** | No on-chain multisig in token; README warns |

### 03.6 — Initial supply / burn authority

| Verdict | **partial** | Mint/burn gated by `minter`; no burn↔supply script in `scripts/` for Solana |

### 03.7 — Devnet testing artifacts

| Verdict | **gap** | No CI or checked-in deployment records |

### 03.8 — Security: key handling in scripts

| Verdict | **partial** | Scaffold uses generated keypair log only |

### 03.9 — Contract tests

| Verdict | **done** | [`contracts/evm/test/RawSwapToken.t.sol`](../../contracts/evm/test/RawSwapToken.t.sol) |

### 03.10 — Cross-reference Wormhole doc

| Verdict | **partial** | [`docs/research/wormhole-ntt.md`](../../docs/research/wormhole-ntt.md) |
