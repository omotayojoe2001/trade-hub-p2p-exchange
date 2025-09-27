-- CHECK CURRENT TRADE STATUS
SELECT 
  id,
  status,
  delivery_code,
  payment_confirmed_by_vendor,
  vendor_id,
  buyer_id,
  seller_id,
  usd_amount,
  created_at
FROM cash_trades 
WHERE id = '4ec634a9-d448-4b74-98af-6486021ea729'
OR trade_request_id = '4ec634a9-d448-4b74-98af-6486021ea729';