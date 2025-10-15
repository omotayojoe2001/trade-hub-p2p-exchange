-- Create escrow_addresses table if it doesn't exist
CREATE TABLE IF NOT EXISTS escrow_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id TEXT NOT NULL,
  coin TEXT NOT NULL,
  address TEXT NOT NULL,
  wallet_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  expected_amount BIGINT,
  received_amount BIGINT,
  confirmations INTEGER DEFAULT 0,
  tx_hash TEXT,
  confirmed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_escrow_addresses_trade_id ON escrow_addresses(trade_id);
CREATE INDEX IF NOT EXISTS idx_escrow_addresses_address ON escrow_addresses(address);
CREATE INDEX IF NOT EXISTS idx_escrow_addresses_status ON escrow_addresses(status);