-- Add referral system tables and functionality

-- Add referral fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;

-- Add referral fields to user_profiles table  
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id);
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;

-- Create referral_commissions table
CREATE TABLE IF NOT EXISTS public.referral_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    trade_id UUID,
    commission_amount DECIMAL(20,8) DEFAULT 0,
    commission_percentage DECIMAL(5,2) DEFAULT 0.3,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on referral_commissions
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_commissions
CREATE POLICY "Users can view their own referral commissions"
    ON public.referral_commissions FOR SELECT
    USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "System can manage referral commissions"
    ON public.referral_commissions FOR ALL
    USING (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 8-character alphanumeric code
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(
            SELECT 1 FROM profiles WHERE referral_code = code
            UNION
            SELECT 1 FROM user_profiles WHERE referral_code = code
        ) INTO exists;
        
        -- Exit loop if code is unique
        IF NOT exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to set referral code on user creation
CREATE OR REPLACE FUNCTION set_user_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate referral code if not set
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := generate_referral_code();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to set referral codes
DROP TRIGGER IF EXISTS set_profiles_referral_code ON public.profiles;
CREATE TRIGGER set_profiles_referral_code
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_user_referral_code();

DROP TRIGGER IF EXISTS set_user_profiles_referral_code ON public.user_profiles;
CREATE TRIGGER set_user_profiles_referral_code
    BEFORE INSERT OR UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_user_referral_code();

-- Function to process referral commission
CREATE OR REPLACE FUNCTION process_referral_commission(
    trade_id_param UUID,
    trade_amount DECIMAL,
    buyer_id UUID,
    seller_id UUID
)
RETURNS VOID AS $$
DECLARE
    buyer_referrer UUID;
    seller_referrer UUID;
    commission_amount DECIMAL;
BEGIN
    -- Get referrer for buyer
    SELECT referred_by INTO buyer_referrer
    FROM profiles
    WHERE user_id = buyer_id AND referred_by IS NOT NULL;
    
    -- Get referrer for seller
    SELECT referred_by INTO seller_referrer
    FROM profiles
    WHERE user_id = seller_id AND referred_by IS NOT NULL;
    
    -- Calculate commission (0.3% of trade amount)
    commission_amount := trade_amount * 0.003;
    
    -- Create commission for buyer's referrer
    IF buyer_referrer IS NOT NULL THEN
        INSERT INTO referral_commissions (
            referrer_id,
            referred_user_id,
            trade_id,
            commission_amount,
            commission_percentage,
            status
        ) VALUES (
            buyer_referrer,
            buyer_id,
            trade_id_param,
            commission_amount,
            0.3,
            'pending'
        );
    END IF;
    
    -- Create commission for seller's referrer (if different)
    IF seller_referrer IS NOT NULL AND seller_referrer != buyer_referrer THEN
        INSERT INTO referral_commissions (
            referrer_id,
            referred_user_id,
            trade_id,
            commission_amount,
            commission_percentage,
            status
        ) VALUES (
            seller_referrer,
            seller_id,
            trade_id_param,
            commission_amount,
            0.3,
            'pending'
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer_id ON referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referred_user_id ON referral_commissions(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_status ON referral_commissions(status);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code ON user_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_user_profiles_referred_by ON user_profiles(referred_by);

-- Update existing users to have referral codes
UPDATE profiles SET referral_code = generate_referral_code() WHERE referral_code IS NULL;
UPDATE user_profiles SET referral_code = generate_referral_code() WHERE referral_code IS NULL;

-- Enable realtime for referral_commissions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'referral_commissions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.referral_commissions;
    END IF;
END $$;
