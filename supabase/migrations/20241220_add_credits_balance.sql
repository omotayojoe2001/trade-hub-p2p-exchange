-- Add credits_balance column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 0;

-- Add completed_at column to credit_purchase_transactions
ALTER TABLE credit_purchase_transactions 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create index for faster credit balance queries
CREATE INDEX IF NOT EXISTS idx_profiles_credits_balance 
ON profiles(user_id, credits_balance);