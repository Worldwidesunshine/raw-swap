# @rawswap/compounder

Cron/worker service: sweep `PROTOCOL_FEE_VAULT` → Jupiter buyback → permanent LP on Orca/Raydium.

## Env

| Variable | Required | Notes |
|----------|----------|--------|
| `REDIS_URL` | yes | BullMQ / queue backend |
| `SOLANA_RPC_URL` | yes | Must be a valid URL |
| `PROTOCOL_FEE_VAULT` | yes | Solana base58 `PublicKey` (vault to monitor) |
| `RAWSWAP_MINT` | no | When set (non-empty), logs a Jupiter buyback plan stub; same pubkey rules |

Startup logs use one JSON object per line (`svc: "compounder"`, ISO `ts`, `level`, `msg`, plus fields) so grep and log shippers stay simple.

Invalid or missing required vars fail validation at startup with a concrete Zod message; validation errors are emitted on stderr as structured JSON (`msg: compounder env validation failed`). `main()` still catches failures without crashing the interpreter (see `src/index.ts`), so local runs without env show both the structured error line and the README hint.

## Runbook

- **Dev:** from repo root, `pnpm --filter @rawswap/compounder dev` (or `cd apps/compounder && pnpm dev`). Requires env in the shell or a `.env` loader you provide.
- **Build / check:** `pnpm --filter @rawswap/compounder build`, `typecheck`, `lint`, `test`.
- **Docker:** build context must be monorepo root; see `apps/compounder/Dockerfile` (`pnpm install --filter @rawswap/compounder...`, then build shared → lp-sdk → compounder).

## Dev

```bash
cd apps/compounder
pnpm dev
```
