# deBridge DLN research (Waves 14–15)

## create-tx

`GET https://dln.debridge.finance/v1.0/dln/order/create-tx`

Use for cross-chain swap quotes and serialized transactions.

## Affiliate fees

- `affiliateFeePercent`
- `affiliateFeeRecipient`  
  Map to `DEBRIDGE_AFFILIATE_*` env vars on API / web.

## Hooks

- `dlnHook` with type `solana_serialized_instructions` for auto-LP or other post-fill actions on Solana.

## Status

`GET /api/Orders/{orderId}/state` for polling fulfillment.

## RawSwap integration

1. Add thin client in `packages/shared` or `apps/web` (`lib/debridge-client.ts`) wrapping create-tx + order state.
2. Persist orders in `cross_chain_transfers` (see migration `0003_liquidity_and_fees.sql` and related schema).
