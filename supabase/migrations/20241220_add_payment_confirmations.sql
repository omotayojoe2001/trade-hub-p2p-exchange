-- Add payment confirmation fields to escrow_addresses table
ALTER TABLE escrow_addresses 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS received_amount BIGINT,
ADD COLUMN IF NOT EXISTS confirmations INTEGER DEFAULT 0;

-- Add index for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_escrow_addresses_lookup 
ON escrow_addresses (address, status) 
WHERE status = 'pending';

-- Create payment_confirmations table for tracking
CREATE TABLE IF NOT EXISTS payment_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_address_id UUID REFERENCES escrow_addresses(id),
  tx_hash TEXT NOT NULL,
  confirmations INTEGER DEFAULT 0,
  amount BIGINT NOT NULL,
  confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);