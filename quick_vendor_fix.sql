-- QUICK FIX FOR VENDOR DASHBOARD
-- Run this in Supabase SQL Editor

-- 1. Update all cash trades with vendor_id to vendor_paid status so vendors can see them
UPDATE cash_trades 
SET status = 'vendor_paid'
WHERE vendor_id IS NOT NULL 
AND status NOT IN ('cash_delivered', 'completed');

-- 2. Add merchant and seller phone columns if they don't exist
ALTER TABLE cash_trades 
ADD COLUMN IF NOT EXISTS merchant_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS merchant_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS seller_phone VARCHAR(20);

-- 3. Update existing trades with merchant/seller info from trade_requests
UPDATE cash_trades ct
SET 
  merchant_name = COALESCE(buyer_profile.full_name, 'Merchant'),
  merchant_phone = COALESCE(buyer_profile.phone, 'Not provided'),
  seller_phone = COALESCE(seller_profile.phone, 'Not provided')
FROM trade_requests tr
LEFT JOIN user_profiles buyer_profile ON buyer_profile.user_id = tr.buyer_id
LEFT JOIN user_profiles seller_profile ON seller_profile.user_id = tr.seller_id
WHERE ct.trade_request_id = tr.id
AND ct.vendor_id IS NOT NULL;

SELECT 'Quick vendor fix applied - vendors should now see deliveries!' as status;