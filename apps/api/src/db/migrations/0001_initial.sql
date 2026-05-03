CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_public_key TEXT NOT NULL,
  input_mint TEXT NOT NULL,
  output_mint TEXT NOT NULL,
  input_amount TEXT NOT NULL,
  expected_output_amount TEXT NOT NULL,
  minimum_output_amount TEXT NOT NULL,
  slippage_bps INTEGER NOT NULL,
  price_impact_pct TEXT,
  route_json JSONB NOT NULL,
  provider TEXT NOT NULL DEFAULT 'jupiter',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS transaction_builds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id),
  user_public_key TEXT NOT NULL,
  unsigned_transaction_base64 TEXT NOT NULL,
  transaction_message_hash TEXT NOT NULL,
  recent_blockhash TEXT NOT NULL,
  last_valid_block_height BIGINT,
  urgency TEXT NOT NULL,
  execution_mode TEXT NOT NULL,
  estimated_priority_fee_lamports BIGINT,
  estimated_jito_tip_lamports BIGINT,
  expected_signers JSONB NOT NULL,
  instruction_program_ids JSONB NOT NULL,
  lookup_table_accounts JSONB,
  build_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id UUID NOT NULL REFERENCES transaction_builds(id),
  ok BOOLEAN NOT NULL,
  units_consumed BIGINT,
  error_json JSONB,
  logs JSONB,
  risk_flags TEXT[],
  simulation_ms INTEGER,
  simulated_transaction_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id UUID NOT NULL REFERENCES transaction_builds(id),
  idempotency_key TEXT,
  signature TEXT UNIQUE,
  bundle_id TEXT,
  signed_transaction_base64 TEXT,
  signed_message_hash TEXT,
  status TEXT NOT NULL,
  submitted_via TEXT,
  submitted_at TIMESTAMPTZ,
  landed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  submitted_slot BIGINT,
  landed_slot BIGINT,
  slots_to_land INTEGER,
  send_latency_ms INTEGER,
  time_to_land_ms INTEGER,
  failure_reason TEXT,
  error_code TEXT,
  priority_fee_lamports BIGINT,
  jito_tip_lamports BIGINT,
  actual_output_amount TEXT,
  realized_slippage_bps INTEGER,
  raw_status_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(build_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS execution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES executions(id),
  event_type TEXT NOT NULL,
  event_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS token_risk_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mint TEXT NOT NULL,
  token_program TEXT NOT NULL,
  decimals INTEGER,
  freeze_authority TEXT,
  mint_authority TEXT,
  token_2022_extensions JSONB,
  risk_flags TEXT[],
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
