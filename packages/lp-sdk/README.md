# @rawswap/lp-sdk

Spike package for Orca legacy Whirlpools SDK + Raydium v2 CPMM (web3.js v1 compatible).

- `pnpm install` at repo root after adding Raydium peer if needed for local spikes.
- `normalizeVenue` / `poolRowFromDbShape` map DB venue strings and pool rows to `@rawswap/shared` `LiquidityPoolEntry` values.
- Wire `listPlaceholderPools` to `liquidity_pools` DB rows and config JSON in later waves.
