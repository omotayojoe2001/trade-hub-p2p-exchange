-- Create credits system with crypto payments

-- 1. Add credits column to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;

-- 2. Create credit purchases table
CREATE TABLE IF NOT EXISTS credit_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    crypto_type VARCHAR(10) NOT NULL CHECK (crypto_type IN ('BTC', 'ETH')),
    crypto_amount DECIMAL(18, 8) NOT NULL,
    credits_amount INTEGER NOT NULL,
    payment_address TEXT NOT NULL,
    transaction_hash TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'confirmed', 'completed', 'failed')),
    payment_proof_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '2 hours')
);

-- 3. Create credit transactions table for tracking
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'spend', 'refund')),
    amount INTEGER NOT NULL,
    description TEXT,
    reference_id UUID, -- Links to credit_purchases or trades
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create function to add credits
CREATE OR REPLACE FUNCTION add_user_credits(user_id_param UUID, credits_amount INTEGER, description_text TEXT DEFAULT 'Credit purchase')
RETURNS BOOLEAN AS $$
BEGIN
    -- Update user credits
    UPDATE profiles 
    SET credits = COALESCE(credits, 0) + credits_amount
    WHERE user_id = user_id_param;
    
    -- Record transaction
    INSERT INTO credit_transactions (user_id, type, amount, description)
    VALUES (user_id_param, 'purchase', credits_amount, description_text);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to spend credits
CREATE OR REPLACE FUNCTION spend_user_credits(user_id_param UUID, credits_amount INTEGER, description_text TEXT DEFAULT 'Credit spent')
RETURNS BOOLEAN AS $$
DECLARE
    current_credits INTEGER;
BEGIN
    -- Get current credits
    SELECT COALESCE(credits, 0) INTO current_credits
    FROM profiles 
    WHERE user_id = user_id_param;
    
    -- Check if user has enough credits
    IF current_credits < credits_amount THEN
        RETURN FALSE;
    END IF;
    
    -- Deduct credits
    UPDATE profiles 
    SET credits = credits - credits_amount
    WHERE user_id = user_id_param;
    
    -- Record transaction
    INSERT INTO credit_transactions (user_id, type, amount, description)
    VALUES (user_id_param, 'spend', -credits_amount, description_text);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant permissions
GRANT ALL ON credit_purchases TO authenticated;
GRANT ALL ON credit_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_credits TO authenticated;
GRANT EXECUTE ON FUNCTION spend_user_credits TO authenticated;