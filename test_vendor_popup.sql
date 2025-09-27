-- Test vendor notification popup
-- Run this in Supabase SQL Editor to trigger vendor notification

-- 1. Get a vendor ID
SELECT id, user_id, display_name FROM vendors LIMIT 1;

-- 2. Get a real trade_request_id (or create one)
SELECT id FROM trade_requests LIMIT 1;

-- 3. Insert test cash trade and trigger notification
DO $$
DECLARE
    test_trade_id UUID;
BEGIN
    INSERT INTO cash_trades (
        trade_request_id,
        seller_id, 
        buyer_id,
        vendor_id,
        usd_amount,
        delivery_type,
        delivery_address,
        delivery_code,
        status
    ) VALUES (
        (SELECT id FROM trade_requests LIMIT 1),
        gen_random_uuid(),
        gen_random_uuid(), 
        (SELECT id FROM vendors LIMIT 1),
        500,
        'delivery',
        '123 Test Street, Lagos, Nigeria',
        'TEST123',
        'pending_payment'
    ) RETURNING id INTO test_trade_id;
    
    -- Trigger notification
    UPDATE cash_trades 
    SET status = 'vendor_paid', updated_at = now()
    WHERE id = test_trade_id;
    
    RAISE NOTICE 'Test notification triggered for trade: %', test_trade_id;
END $$;

-- 5. Check if notification was created
SELECT 
    n.title, 
    n.message, 
    n.created_at,
    v.display_name as vendor_name
FROM notifications n
JOIN vendors v ON n.user_id = v.user_id
WHERE n.type = 'vendor_payment_received'
ORDER BY n.created_at DESC
LIMIT 1;