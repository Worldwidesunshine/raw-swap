-- Liquidity, protocol fees, cross-chain tracking (RawSwap build spec v2)

ALTER TABLE executions
  ADD COLUMN IF NOT EXISTS protocol_fee_lamports BIGINT,
  ADD COLUMN IF NOT EXISTS treasury_fee_lamports BIGINT;

ALTER TABLE transaction_builds
  ADD COLUMN IF NOT EXISTS estimated_protocol_buyback_fee_lamports BIGINT,
  ADD COLUMN IF NOT EXISTS estimated_protocol_treasury_fee_lamports BIGINT;

CREATE TABLE IF NOT EXISTS protocol_fee_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_signature TEXT,
  deployment_type TEXT NOT NULL,
  buyback_sol_lamports BIGINT,
  rawswap_amount TEXT,
  orca_pool_address TEXT,
  raydium_pool_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS protocol_fee_deployments_status_idx ON protocol_fee_deployments (status);

CREATE TABLE IF NOT EXISTS liquidity_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'solana',
  pool_address TEXT NOT NULL,
  mint_a TEXT NOT NULL,
  mint_b TEXT NOT NULL,
  fee_tier_bps INTEGER,
  tvl_usd_estimate TEXT,
  is_protocol_owned BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (chain, venue, pool_address)
);

CREATE TABLE IF NOT EXISTS lp_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_public_key TEXT NOT NULL,
  venue TEXT NOT NULL,
  pool_address TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'solana',
  position_mint TEXT,
  liquidity_raw TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lp_positions_wallet_idx ON lp_positions (wallet_public_key);

CREATE TABLE IF NOT EXISTS cross_chain_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  order_id TEXT,
  source_chain TEXT NOT NULL,
  dest_chain TEXT NOT NULL,
  status TEXT NOT NULL,
  amount_in TEXT,
  amount_out TEXT,
  mint_in TEXT,
  mint_out TEXT,
  wallet_public_key TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cross_chain_transfers_order_idx ON cross_chain_transfers (order_id);

CREATE TABLE IF NOT EXISTS evm_liquidity_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain TEXT NOT NULL,
  dex TEXT NOT NULL,
  pool_address TEXT NOT NULL,
  token0 TEXT NOT NULL,
  token1 TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (chain, dex, pool_address)
);

CREATE TABLE IF NOT EXISTS rewards_epochs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain TEXT NOT NULL,
  epoch_index BIGINT NOT NULL,
  total_rawswap_allocated TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (chain, epoch_index)
);
