-- FIX MERCHANT ASSIGNMENT IN CASH TRADES
-- Run this in Supabase SQL Editor

-- Update cash_trades with merchant_id from trade_requests
UPDATE cash_trades 
SET buyer_id = tr.merchant_id
FROM trade_requests tr
WHERE cash_trades.trade_request_id = tr.id
AND cash_trades.buyer_id IS NULL
AND tr.merchant_id IS NOT NULL;

-- For the specific trade that's failing
UPDATE cash_trades 
SET buyer_id = (
  SELECT merchant_id 
  FROM trade_requests 
  WHERE id = 'ad205932-218b-40e2-a671-dd6e800baa79'
  LIMIT 1
)
WHERE id = '63c77fe6-1fd5-43f6-bbb3-cfb8dfcb8b39'
AND buyer_id IS NULL;

-- Check the result
SELECT 
  ct.id,
  ct.buyer_id,
  ct.trade_request_id,
  tr.merchant_id,
  up.full_name as merchant_name
FROM cash_trades ct
LEFT JOIN trade_requests tr ON ct.trade_request_id = tr.id
LEFT JOIN user_profiles up ON ct.buyer_id = up.user_id
WHERE ct.id = '63c77fe6-1fd5-43f6-bbb3-cfb8dfcb8b39';

SELECT 'Merchant assignment fixed!' as status;