# Wave 20 — Hardening — Audit Report

**Wave:** 20  
**Overall status:** **partial**  

## Merge summary

**CI** [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml): lint, typecheck, test, build, docker compose validate, smoke on `main`. **Docs** [`hardening-wave-20.md`](../../docs/research/hardening-wave-20.md) list security/CU/gas/OpenAPI items — many **aspirational**. Rate limits: Fastify plugins exist in API (spot-check separate).

## Agent findings

### 20.1 — CI coverage

| Verdict | **done** | Multi-job workflow |

### 20.2 — Secret scanning

| Verdict | **gap** | No gitleaks in workflow |

### 20.3 — Dependency review

| Verdict | **gap** | No Dependabot in-repo |

### 20.4 — Solana CU profiling doc

| Verdict | **gap** | Doc item only |

### 20.5 — EVM gas snapshots

| Verdict | **gap** | Doc item only |

### 20.6 — OpenAPI publish

| Verdict | **partial** | Swagger plugin in API |

### 20.7 — Mainnet runbook

| Verdict | **partial** | README + evm README |

### 20.8 — Signer custody review

| Verdict | **gap** | Process not in repo |

### 20.9 — Docker Hardening

| Verdict | **partial** | Non-root not audited |

### 20.10 — Incident response

| Verdict | **gap** | — |
