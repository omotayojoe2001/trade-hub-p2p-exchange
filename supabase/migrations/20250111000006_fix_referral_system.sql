-- Fix referral system to track signups and calculate 3% commission from company earnings

-- Ensure referred_by column exists in profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id);

-- Create referral_signups table to track when someone signs up via referral
CREATE TABLE IF NOT EXISTS public.referral_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT,
  signup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update referral_commissions table to track company earnings and 3% commission
DROP TABLE IF EXISTS public.referral_commissions;
CREATE TABLE public.referral_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_id UUID,
  company_earnings DECIMAL(20,2) DEFAULT 0, -- What company earned from the trade
  commission_amount DECIMAL(20,2) DEFAULT 0, -- 3% of company earnings
  commission_percentage DECIMAL(5,2) DEFAULT 3.0, -- 3%
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.referral_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own referral signups" ON public.referral_signups FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Users can view their own referral commissions" ON public.referral_commissions FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "System can manage referral data" ON public.referral_signups FOR ALL USING (true);
CREATE POLICY "System can manage referral commissions" ON public.referral_commissions FOR ALL USING (true);

-- Function to process referral signup
CREATE OR REPLACE FUNCTION process_referral_signup(
  new_user_id UUID,
  referrer_user_id UUID,
  referral_code_used TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Update the new user's profile with referrer
  UPDATE profiles 
  SET referred_by = referrer_user_id 
  WHERE user_id = new_user_id;
  
  -- Record the referral signup
  INSERT INTO referral_signups (
    referrer_id,
    referred_user_id,
    referral_code,
    signup_date
  ) VALUES (
    referrer_user_id,
    new_user_id,
    referral_code_used,
    NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Function to calculate referral commission from company earnings
CREATE OR REPLACE FUNCTION calculate_referral_commission(
  trade_id_param UUID,
  company_earnings_amount DECIMAL,
  trader_user_id UUID
)
RETURNS VOID AS $$
DECLARE
  referrer_id UUID;
  commission_amount DECIMAL;
BEGIN
  -- Get the referrer for this trader
  SELECT referred_by INTO referrer_id
  FROM profiles
  WHERE user_id = trader_user_id AND referred_by IS NOT NULL;
  
  -- If trader was referred, calculate commission
  IF referrer_id IS NOT NULL THEN
    -- Calculate 3% of company earnings
    commission_amount := company_earnings_amount * 0.03;
    
    -- Insert commission record
    INSERT INTO referral_commissions (
      referrer_id,
      referred_user_id,
      trade_id,
      company_earnings,
      commission_amount,
      commission_percentage,
      status
    ) VALUES (
      referrer_id,
      trader_user_id,
      trade_id_param,
      company_earnings_amount,
      commission_amount,
      3.0,
      'pending'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referral_signups_referrer ON referral_signups(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_signups_referred ON referral_signups(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer ON referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);