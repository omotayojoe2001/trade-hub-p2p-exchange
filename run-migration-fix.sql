-- Safe migration script to fix trade data integrity issues
-- This script is idempotent and can be run multiple times safely

-- First, let's add the missing columns to existing tables
DO $$ 
BEGIN
    -- Add columns to trades table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'trade_step') THEN
        ALTER TABLE trades ADD COLUMN trade_step INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'last_action_timestamp') THEN
        ALTER TABLE trades ADD COLUMN last_action_timestamp TIMESTAMP DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'trade_data') THEN
        ALTER TABLE trades ADD COLUMN trade_data JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'merchant_rate') THEN
        ALTER TABLE trades ADD COLUMN merchant_rate DECIMAL(20,8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'platform_fee_percentage') THEN
        ALTER TABLE trades ADD COLUMN platform_fee_percentage DECIMAL(5,2) DEFAULT 1.0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'platform_fee_amount') THEN
        ALTER TABLE trades ADD COLUMN platform_fee_amount DECIMAL(20,8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'net_amount') THEN
        ALTER TABLE trades ADD COLUMN net_amount DECIMAL(20,8);
    END IF;
END $$;

-- Add columns to trade_requests table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_requests' AND column_name = 'request_step') THEN
        ALTER TABLE trade_requests ADD COLUMN request_step INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_requests' AND column_name = 'last_action_timestamp') THEN
        ALTER TABLE trade_requests ADD COLUMN last_action_timestamp TIMESTAMP DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_requests' AND column_name = 'request_data') THEN
        ALTER TABLE trade_requests ADD COLUMN request_data JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_requests' AND column_name = 'selected_merchant_id') THEN
        ALTER TABLE trade_requests ADD COLUMN selected_merchant_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_requests' AND column_name = 'merchant_rate') THEN
        ALTER TABLE trade_requests ADD COLUMN merchant_rate DECIMAL(20,8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_requests' AND column_name = 'platform_fee_percentage') THEN
        ALTER TABLE trade_requests ADD COLUMN platform_fee_percentage DECIMAL(5,2) DEFAULT 1.0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_requests' AND column_name = 'platform_fee_amount') THEN
        ALTER TABLE trade_requests ADD COLUMN platform_fee_amount DECIMAL(20,8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trade_requests' AND column_name = 'net_amount') THEN
        ALTER TABLE trade_requests ADD COLUMN net_amount DECIMAL(20,8);
    END IF;
END $$;

-- Create user_bank_accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    bank_code VARCHAR(10),
    is_default BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create trade_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS trade_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trade_type VARCHAR(10) NOT NULL,
    coin_type VARCHAR(10) NOT NULL,
    current_step INTEGER DEFAULT 1,
    selected_merchant_id UUID,
    amount DECIMAL(20,8),
    naira_amount DECIMAL(20,8),
    merchant_rate DECIMAL(20,8),
    selected_bank_account_id UUID,
    trade_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 minutes')
);

-- Enable RLS safely
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_bank_accounts') THEN
        ALTER TABLE user_bank_accounts ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'trade_progress') THEN
        ALTER TABLE trade_progress ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies safely
DROP POLICY IF EXISTS "Users can manage their own bank accounts" ON user_bank_accounts;
CREATE POLICY "Users can manage their own bank accounts" 
    ON user_bank_accounts FOR ALL 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own trade progress" ON trade_progress;
CREATE POLICY "Users can manage their own trade progress" 
    ON trade_progress FOR ALL 
    USING (auth.uid() = user_id);

-- Create helpful functions
CREATE OR REPLACE FUNCTION calculate_platform_fee(
    naira_amount DECIMAL,
    fee_percentage DECIMAL DEFAULT 1.0
) RETURNS DECIMAL AS $$
BEGIN
    RETURN ROUND(naira_amount * (fee_percentage / 100), 2);
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_bank_accounts_user_id ON user_bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_progress_user_id ON trade_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_progress_expires_at ON trade_progress(expires_at);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trade_requests_status ON trade_requests(status);

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Migration completed successfully! All tables and policies are now properly configured.';
END $$;
