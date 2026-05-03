# Raw Swap

Monorepo: Next.js web + Fastify API + BullMQ worker for SOL ⇄ USDC swaps via Jupiter Swap API v2 `/build` and Jito `sendTransaction` (bundleOnly).

## Prerequisites

- Node 20+
- pnpm 9+
- Docker (for local Postgres/Redis)

## Quick start

```bash
cd "Raw Swap"
pnpm install
pnpm exec turbo run build --filter=@rawswap/shared --filter=@rawswap/lp-sdk --filter=@rawswap/tx-composer --filter=@rawswap/tx-verifier
docker compose -f infra/docker-compose.yml up -d
export DATABASE_URL=postgresql://rawswap:rawswap@localhost:5432/rawswap
export REDIS_URL=redis://127.0.0.1:6379
export SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
pnpm db:migrate
# Optional: demo rows in liquidity_pools for local API/UI (still needs DATABASE_URL)
# pnpm seed:liquidity-pools
pnpm dev
```

- Web: http://localhost:3000  
- API: http://localhost:3001  
- API docs: http://localhost:3001/docs
- Copy `.env.example` to `.env` and adjust as needed. Set `JUPITER_API_KEY` in `.env` (portal.jup.ag) for production rate limits.
- Optional: `LP_DEV_STUB_LIQUIDITY_TX=1` on the API enables a dev-only placeholder transaction for liquidity deposit/withdraw endpoints (see `.env.example`).
- `submit` responses now return an `executionAccessToken`; clients must send it back on status/report reads via `x-execution-token`.

## Packages

- `apps/web` — Wallet adapter UI  
- `apps/api` — Quote / build / submit / status / report  
- `apps/worker` — Landing monitor (BullMQ)  
- `packages/shared` — Types, Zod, errors  
- `packages/lp-sdk` — Orca/Raydium-style liquidity helpers  
- `packages/tx-composer` — v0 tx composition  
- `packages/tx-verifier` — Verify / fingerprint / parse  

## Scripts

- `pnpm db:migrate` — Applies SQL files in `apps/api/src/db/migrations` in order, recording filenames in `_rawswap_migrations` (safe to re-run). Requires `DATABASE_URL`. Existing databases that already ran `0001_initial.sql` manually should insert one row: `INSERT INTO _rawswap_migrations (filename) VALUES ('0001_initial.sql');` before migrating.  
- `pnpm seed:liquidity-pools` — Inserts stub `liquidity_pools` rows for local testing after migrations (requires `DATABASE_URL`).  
- `pnpm dev` — Turborepo dev (run packages with `dev` scripts)

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs:

1. **`build` job** — `pnpm install --frozen-lockfile`, then `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`. Uses pnpm store cache (via `actions/setup-node` `cache: pnpm`) and a Turborepo `.turbo` cache keyed on `pnpm-lock.yaml` + `turbo.json`. Unit tests do not require Postgres or `DATABASE_URL` on the runner.
2. **`docker-validate` job** — `docker compose … config` on `infra/docker-compose.yml`, `docker-compose.test.yml`, and `docker-compose.prod.yml`. Uses a copied `.env.production` from `.env.production.example` and inline placeholder env (`POSTGRES_PASSWORD`, `NEXT_PUBLIC_*`) for the prod compose parse only.
3. **`smoke-test` job** (push to `main` only, after `build`) — `scripts/smoke-test.sh`: builds and runs `infra/docker-compose.test.yml`, runs `pnpm db:migrate` from the host with `DATABASE_URL` pointing at localhost Postgres (port published by compose), then Vitest smoke tests. Override `SMOKE_API_URL` or `SMOKE_EXECUTION_TOKEN_SECRET` if needed (defaults match `docker-compose.test.yml`).

No secrets or repository variables are required for CI. Production/runtime keys (e.g. `JUPITER_API_KEY`, `LP_DEV_STUB_LIQUIDITY_TX`) are documented in `.env.example` for local use only.

## Troubleshooting

- **Docker image build: `pnpm install` fails with `ECONNRESET` / `ERR_SOCKET_TIMEOUT` when fetching npm tarballs** — Registry or network blips; retry `docker compose build` or `pnpm test:smoke`. Dockerfiles set higher `NPM_CONFIG_FETCH_RETRIES` and backoff timeouts for installs inside the image. API/worker/web images also run `corepack prepare pnpm@9.14.2` before `COPY . .` so the pnpm download layer is cached independently of app source changes.

## Production

Use `.env.production` based on `.env.production.example`, including a strong `EXECUTION_ACCESS_TOKEN_SECRET`, then run:

```bash
docker compose --env-file .env.production -f infra/docker-compose.prod.yml up -d --build
```

The production compose stack now includes `api`, `web`, `worker`, Postgres, Redis, and optional Prometheus/Grafana via `--profile observability`.
