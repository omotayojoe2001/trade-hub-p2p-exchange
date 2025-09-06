-- Create test merchants and fix merchant discovery

-- First, let's check current profiles
SELECT user_id, display_name, is_merchant, merchant_mode, is_active FROM profiles WHERE user_id != '12773cd2-a8a6-4403-9da8-bd049ccf8bed' LIMIT 5;

-- Create some test merchant users if they don't exist
DO $$
BEGIN
    -- Create test merchant 1
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE display_name = 'Test Merchant 1') THEN
        INSERT INTO profiles (user_id, display_name, is_merchant, merchant_mode, is_active, rating, user_type)
        VALUES (
            gen_random_uuid(),
            'Test Merchant 1',
            true,
            true,
            true,
            4.8,
            'merchant'
        );
    END IF;
    
    -- Create test merchant 2
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE display_name = 'Test Merchant 2') THEN
        INSERT INTO profiles (user_id, display_name, is_merchant, merchant_mode, is_active, rating, user_type)
        VALUES (
            gen_random_uuid(),
            'Test Merchant 2',
            true,
            true,
            true,
            4.6,
            'merchant'
        );
    END IF;
    
    -- Create test merchant 3
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE display_name = 'Test Merchant 3') THEN
        INSERT INTO profiles (user_id, display_name, is_merchant, merchant_mode, is_active, rating, user_type)
        VALUES (
            gen_random_uuid(),
            'Test Merchant 3',
            true,
            true,
            true,
            4.9,
            'merchant'
        );
    END IF;
END $$;

-- Update the profiles RLS policy to allow better merchant visibility
DROP POLICY IF EXISTS "view_active_merchants_only" ON public.profiles;

CREATE POLICY "view_active_merchants_only" ON public.profiles
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (is_merchant = true AND merchant_mode = true AND COALESCE(is_active, true) = true)
    );

-- Also create a more open merchant visibility policy
CREATE POLICY "public_merchant_visibility" ON public.profiles
    FOR SELECT USING (
        is_merchant = true AND merchant_mode = true
    );

-- Verify merchants exist
SELECT user_id, display_name, is_merchant, merchant_mode, is_active, rating 
FROM profiles 
WHERE is_merchant = true AND merchant_mode = true 
ORDER BY rating DESC;