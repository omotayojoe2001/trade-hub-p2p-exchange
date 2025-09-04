-- Fix trade data integrity and add proper state management

-- Add proper trade state tracking
ALTER TABLE trades ADD COLUMN IF NOT EXISTS trade_step INTEGER DEFAULT 1;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS last_action_timestamp TIMESTAMP DEFAULT NOW();
ALTER TABLE trades ADD COLUMN IF NOT EXISTS trade_data JSONB DEFAULT '{}';
ALTER TABLE trades ADD COLUMN IF NOT EXISTS merchant_rate DECIMAL(20,8);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS platform_fee_percentage DECIMAL(5,2) DEFAULT 1.0;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS platform_fee_amount DECIMAL(20,8);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS net_amount DECIMAL(20,8);

-- Add proper trade request state tracking
ALTER TABLE trade_requests ADD COLUMN IF NOT EXISTS request_step INTEGER DEFAULT 1;
ALTER TABLE trade_requests ADD COLUMN IF NOT EXISTS last_action_timestamp TIMESTAMP DEFAULT NOW();
ALTER TABLE trade_requests ADD COLUMN IF NOT EXISTS request_data JSONB DEFAULT '{}';
ALTER TABLE trade_requests ADD COLUMN IF NOT EXISTS selected_merchant_id UUID REFERENCES auth.users(id);
ALTER TABLE trade_requests ADD COLUMN IF NOT EXISTS merchant_rate DECIMAL(20,8);
ALTER TABLE trade_requests ADD COLUMN IF NOT EXISTS platform_fee_percentage DECIMAL(5,2) DEFAULT 1.0;
ALTER TABLE trade_requests ADD COLUMN IF NOT EXISTS platform_fee_amount DECIMAL(20,8);
ALTER TABLE trade_requests ADD COLUMN IF NOT EXISTS net_amount DECIMAL(20,8);

-- Create user_bank_accounts table for proper bank account management
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

-- Create trade_progress table for step-by-step tracking
CREATE TABLE IF NOT EXISTS trade_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trade_type VARCHAR(10) NOT NULL, -- 'buy' or 'sell'
    coin_type VARCHAR(10) NOT NULL,
    current_step INTEGER DEFAULT 1,
    selected_merchant_id UUID REFERENCES auth.users(id),
    amount DECIMAL(20,8),
    naira_amount DECIMAL(20,8),
    merchant_rate DECIMAL(20,8),
    selected_bank_account_id UUID REFERENCES user_bank_accounts(id),
    trade_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 minutes')
);

-- Create proper merchant_ratings table (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'merchant_ratings') THEN
        CREATE TABLE merchant_ratings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
            customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
            communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
            speed_rating INTEGER CHECK (speed_rating >= 1 AND speed_rating <= 5),
            reliability_rating INTEGER CHECK (reliability_rating >= 1 AND reliability_rating <= 5),
            feedback_text TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );
    END IF;
END $$;

-- Enable RLS (safe to run multiple times)
DO $$
BEGIN
    -- Enable RLS on user_bank_accounts
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_bank_accounts') THEN
        ALTER TABLE user_bank_accounts ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Enable RLS on trade_progress
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'trade_progress') THEN
        ALTER TABLE trade_progress ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Enable RLS on merchant_ratings
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'merchant_ratings') THEN
        ALTER TABLE merchant_ratings ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- RLS policies for user_bank_accounts
DROP POLICY IF EXISTS "Users can manage their own bank accounts" ON user_bank_accounts;
CREATE POLICY "Users can manage their own bank accounts"
    ON user_bank_accounts FOR ALL
    USING (auth.uid() = user_id);

-- RLS policies for trade_progress
DROP POLICY IF EXISTS "Users can manage their own trade progress" ON trade_progress;
CREATE POLICY "Users can manage their own trade progress"
    ON trade_progress FOR ALL
    USING (auth.uid() = user_id);

-- RLS policies for merchant_ratings
DROP POLICY IF EXISTS "Users can view ratings for their trades" ON merchant_ratings;
CREATE POLICY "Users can view ratings for their trades"
    ON merchant_ratings FOR SELECT
    USING (auth.uid() = customer_id OR auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Customers can create ratings" ON merchant_ratings;
CREATE POLICY "Customers can create ratings"
    ON merchant_ratings FOR INSERT
    WITH CHECK (auth.uid() = customer_id);

-- Function to calculate platform fees (CREATE OR REPLACE is safe)
CREATE OR REPLACE FUNCTION calculate_platform_fee(
    naira_amount DECIMAL,
    fee_percentage DECIMAL DEFAULT 1.0
) RETURNS DECIMAL AS $$
BEGIN
    RETURN ROUND(naira_amount * (fee_percentage / 100), 2);
END;
$$ LANGUAGE plpgsql;

-- Function to update merchant average ratings (CREATE OR REPLACE is safe)
CREATE OR REPLACE FUNCTION update_merchant_ratings(merchant_user_id UUID) RETURNS VOID AS $$
DECLARE
    avg_overall DECIMAL;
    avg_communication DECIMAL;
    avg_speed DECIMAL;
    avg_reliability DECIMAL;
    total_ratings INTEGER;
BEGIN
    SELECT
        AVG(overall_rating),
        AVG(communication_rating),
        AVG(speed_rating),
        AVG(reliability_rating),
        COUNT(*)
    INTO avg_overall, avg_communication, avg_speed, avg_reliability, total_ratings
    FROM merchant_ratings
    WHERE merchant_id = merchant_user_id;

    UPDATE user_profiles SET
        rating = COALESCE(avg_overall, 5.0),
        updated_at = NOW()
    WHERE user_id = merchant_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired trade progress (CREATE OR REPLACE is safe)
CREATE OR REPLACE FUNCTION clean_expired_trade_progress() RETURNS VOID AS $$
BEGIN
    DELETE FROM trade_progress WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_bank_accounts_user_id ON user_bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_progress_user_id ON trade_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_progress_expires_at ON trade_progress(expires_at);
CREATE INDEX IF NOT EXISTS idx_merchant_ratings_merchant_id ON merchant_ratings(merchant_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trade_requests_status ON trade_requests(status);
