# Integration checklist (Wave 19)

- [ ] Swap with protocol fee on SOL → verify fee vault + treasury balances.
- [ ] Compounder dry-run on devnet fee vault dust.
- [ ] NTT round trip (lock Solana → mint EVM → burn EVM → unlock Solana) on test deployment.
- [ ] deBridge order create-tx + poll state to `fulfilled`.
- [ ] LP deposit/withdraw cycle on Orca + Raydium devnet pools.
- [ ] Fee vault deposit on EVM testnet4626.

Docker: extend `infra/docker-compose.yml` (and prod/test variants under `infra/`) with compounder + observability stack when ready.
