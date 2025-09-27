-- FIX TRADE STATUS AND DELIVERY CODE VISIBILITY
-- Run this in Supabase SQL Editor

-- 1. Fix trades showing as delivered when they shouldn't be
UPDATE cash_trades 
SET status = 'vendor_paid'
WHERE status = 'cash_delivered' 
AND payment_confirmed_by_vendor IS NOT TRUE
AND vendor_id IS NOT NULL;

-- 2. Fix any trades with wrong status - set to proper initial status
UPDATE cash_trades 
SET status = 'vendor_paid'
WHERE status NOT IN ('vendor_paid', 'payment_confirmed', 'delivery_in_progress', 'cash_delivered')
AND vendor_id IS NOT NULL;

-- 3. Ensure new trades start with correct status
UPDATE cash_trades 
SET status = 'vendor_paid'
WHERE status = 'pending_payment'
AND vendor_id IS NOT NULL
AND buyer_id IS NOT NULL;

-- 3. Update customer phone to get from seller's profile (the user who wants cash)
UPDATE cash_trades ct
SET 
  customer_phone = seller_profile.phone,
  customer_name = COALESCE(seller_profile.full_name, 'Customer')
FROM user_profiles seller_profile
WHERE ct.seller_id = seller_profile.user_id
AND ct.vendor_id IS NOT NULL;

-- 4. Also update seller_phone to match customer_phone for consistency
UPDATE cash_trades 
SET seller_phone = customer_phone
WHERE vendor_id IS NOT NULL
AND customer_phone IS NOT NULL;

SELECT 'Trade status and customer details fixed!' as status;