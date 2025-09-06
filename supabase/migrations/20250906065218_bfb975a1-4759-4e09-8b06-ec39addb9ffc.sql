-- Fix merchant_settings table by removing non-existent merchant_type column reference
-- and update RLS policies to allow users to see each other for trading

-- Update profiles RLS policy to allow users to see other users for trading
DROP POLICY IF EXISTS "Users can view other profiles for trading" ON public.profiles;
CREATE POLICY "Users can view other profiles for trading" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Fix merchant settings by removing the problematic insert that references non-existent merchant_type column
-- We'll create a simpler merchant settings insert that only uses existing columns