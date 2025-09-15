-- Fix premium_cash_orders status constraint issue

-- Drop existing check constraint if it exists
ALTER TABLE premium_cash_orders DROP CONSTRAINT IF EXISTS premium_cash_orders_status_check;

-- Ensure status column is TEXT type (not enum)
ALTER TABLE premium_cash_orders ALTER COLUMN status TYPE TEXT;

-- Add new check constraint with all valid statuses
ALTER TABLE premium_cash_orders 
ADD CONSTRAINT premium_cash_orders_status_check 
CHECK (status IN (
    'pending',
    'awaiting_merchant', 
    'merchant_accepted',
    'payment_sent',
    'vendor_assigned',
    'vendor_confirmed',
    'out_for_delivery',
    'completed',
    'cancelled',
    'disputed'
));

-- Add missing columns if they don't exist
ALTER TABLE premium_cash_orders 
ADD COLUMN IF NOT EXISTS escrow_address TEXT,
ADD COLUMN IF NOT EXISTS vault_id TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;