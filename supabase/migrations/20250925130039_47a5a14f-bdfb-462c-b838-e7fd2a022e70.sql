-- Complete vendors table fix to match TypeScript interfaces
-- This will resolve the TypeScript errors by ensuring the database schema matches the expected interfaces

-- Add missing columns to vendors table
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50),
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS bank_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Copy data from existing columns to new columns where data exists
UPDATE vendors SET 
  display_name = COALESCE(display_name, name),
  phone = COALESCE(phone, phone_number),
  bank_account = COALESCE(bank_account, account_number),
  active = COALESCE(active, is_active, true)
WHERE display_name IS NULL OR phone IS NULL OR bank_account IS NULL OR active IS NULL;

-- Create vendor_jobs table if it doesn't exist (referenced in the code)
CREATE TABLE IF NOT EXISTS vendor_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id),
  premium_user_id UUID,
  buyer_id UUID,
  trade_id UUID,
  amount_usd NUMERIC,
  delivery_type TEXT,
  status TEXT DEFAULT 'pending_payment',
  address_json JSONB,
  credits_required INTEGER,
  verification_code TEXT,
  tracking_code TEXT,
  order_type TEXT,
  naira_amount_paid NUMERIC,
  cash_order_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);