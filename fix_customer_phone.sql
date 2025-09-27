-- FIX CUSTOMER PHONE NUMBER ISSUE
-- Run this in Supabase SQL Editor

-- Update customer phone to get from seller's profile (the user who wants cash)
UPDATE cash_trades ct
SET 
  customer_phone = seller_profile.phone,
  customer_name = COALESCE(seller_profile.full_name, 'Customer')
FROM user_profiles seller_profile
WHERE ct.seller_id = seller_profile.user_id
AND ct.vendor_id IS NOT NULL;

-- Also update seller_phone to match customer_phone for consistency
UPDATE cash_trades 
SET seller_phone = customer_phone
WHERE vendor_id IS NOT NULL
AND customer_phone IS NOT NULL;

SELECT 'Customer phone numbers fixed!' as status;