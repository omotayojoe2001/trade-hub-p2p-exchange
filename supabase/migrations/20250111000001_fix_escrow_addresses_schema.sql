-- Fix escrow_addresses table schema
ALTER TABLE public.escrow_addresses 
ADD COLUMN IF NOT EXISTS expected_amount DECIMAL,
ADD COLUMN IF NOT EXISTS received_amount DECIMAL,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;