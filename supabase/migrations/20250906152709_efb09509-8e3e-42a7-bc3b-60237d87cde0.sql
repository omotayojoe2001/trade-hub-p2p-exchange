-- Fix merchant discovery - enable merchant_mode for existing merchants
UPDATE profiles 
SET merchant_mode = true 
WHERE is_merchant = true AND user_type = 'merchant';

-- Update RLS policy to show merchants properly
DROP POLICY IF EXISTS "view_active_merchants_only" ON public.profiles;
DROP POLICY IF EXISTS "public_merchant_visibility" ON public.profiles;

-- Create a single clear policy for profile visibility
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (
        auth.uid() = user_id OR  -- Users can see their own profile
        (is_merchant = true AND is_active = true)  -- Anyone can see active merchants
    );

-- Check the results
SELECT user_id, display_name, is_merchant, merchant_mode, is_active, user_type 
FROM profiles 
WHERE is_merchant = true 
ORDER BY display_name;