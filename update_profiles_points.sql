-- Add points balance to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points_balance INTEGER DEFAULT 100;

-- Update existing premium users to have 100 points
UPDATE profiles SET points_balance = 100 WHERE points_balance IS NULL;

-- Create points_transactions table for tracking
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID, -- Will add foreign key later after premium_cash_orders is created
  points_amount INTEGER NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('deduction', 'refund', 'bonus')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own points transactions" ON points_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Add index
CREATE INDEX idx_points_transactions_user_id ON points_transactions(user_id);