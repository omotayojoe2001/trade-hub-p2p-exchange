-- EMERGENCY: Delete ALL trade requests to stop the spam
-- This will clean up all the duplicate/unwanted trade requests

-- Step 1: Show current trade requests before deletion
SELECT 
    COUNT(*) as total_requests,
    COUNT(DISTINCT user_id) as unique_users,
    trade_type,
    coin_type,
    status
FROM public.trade_requests 
GROUP BY trade_type, coin_type, status
ORDER BY total_requests DESC;

-- Step 2: Delete ALL trade requests
DELETE FROM public.trade_requests;

-- Step 3: Delete ALL notifications related to trade requests
DELETE FROM public.notifications WHERE type = 'trade_request';

-- Step 4: Verify cleanup
SELECT COUNT(*) as remaining_trade_requests FROM public.trade_requests;
SELECT COUNT(*) as remaining_notifications FROM public.notifications WHERE type = 'trade_request';

-- Step 5: Show success message
DO $$
BEGIN
    RAISE NOTICE 'SUCCESS: All trade requests and notifications deleted';
    RAISE NOTICE 'The system is now clean and ready for proper testing';
END $$;
