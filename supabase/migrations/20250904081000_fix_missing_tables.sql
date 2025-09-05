-- Fix missing tables and database schema issues

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('bank_account', 'mobile_money', 'crypto_wallet')),
    account_name VARCHAR(255),
    account_number VARCHAR(50),
    bank_name VARCHAR(255),
    bank_code VARCHAR(20),
    is_default BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on payment_methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_methods
CREATE POLICY "Users can manage their own payment methods"
    ON public.payment_methods FOR ALL
    USING (auth.uid() = user_id);

-- Fix profiles table constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_type_check 
    CHECK (user_type IN ('customer', 'merchant', 'premium'));

-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE;

-- Add missing columns to user_profiles table
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Fix trades table columns
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON payment_methods(type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(is_default);

-- Update trigger for payment_methods
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for payment_methods
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'payment_methods'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_methods;
    END IF;
END $$;

-- Fix welcome notification trigger to prevent duplicates
CREATE OR REPLACE FUNCTION public.create_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if welcome notification already exists
    IF NOT EXISTS (
        SELECT 1 FROM public.notifications 
        WHERE user_id = NEW.user_id 
        AND type = 'success' 
        AND title = 'Welcome to Central Exchange!'
    ) THEN
        INSERT INTO public.notifications (user_id, type, title, message, read, data)
        VALUES (
            NEW.user_id,
            'success',
            'Welcome to Central Exchange!',
            'Your account has been created successfully. Start trading crypto with confidence.',
            false,
            jsonb_build_object('welcome', true)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user_bank_accounts table if it doesn't exist (compatibility)
CREATE TABLE IF NOT EXISTS public.user_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    bank_code VARCHAR(10),
    is_default BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on user_bank_accounts
ALTER TABLE public.user_bank_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_bank_accounts
DROP POLICY IF EXISTS "Users can manage their own bank accounts" ON user_bank_accounts;
CREATE POLICY "Users can manage their own bank accounts"
    ON public.user_bank_accounts FOR ALL
    USING (auth.uid() = user_id);

-- Create indexes for user_bank_accounts
CREATE INDEX IF NOT EXISTS idx_user_bank_accounts_user_id ON user_bank_accounts(user_id);

-- Update trigger for user_bank_accounts
DROP TRIGGER IF EXISTS update_user_bank_accounts_updated_at ON public.user_bank_accounts;
CREATE TRIGGER update_user_bank_accounts_updated_at
    BEFORE UPDATE ON public.user_bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for user_bank_accounts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'user_bank_accounts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_bank_accounts;
    END IF;
END $$;
