-- Clean up duplicate and invalid trade requests

-- Step 1: Show current trade requests before cleanup
SELECT 
    id,
    user_id,
    trade_type,
    coin_type,
    amount,
    naira_amount,
    rate,
    status,
    created_at
FROM public.trade_requests 
ORDER BY created_at DESC;

-- Step 2: Delete duplicate trade requests (keep only the most recent for each user/coin combination)
WITH ranked_requests AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, trade_type, coin_type, amount, naira_amount 
            ORDER BY created_at DESC
        ) as rn
    FROM public.trade_requests
)
DELETE FROM public.trade_requests 
WHERE id IN (
    SELECT id FROM ranked_requests WHERE rn > 1
);

-- Step 3: Delete very old trade requests (older than 24 hours)
DELETE FROM public.trade_requests 
WHERE created_at < (NOW() - INTERVAL '24 hours')
AND status = 'open';

-- Step 4: Fix invalid coin types (change BNB to BTC if any exist)
UPDATE public.trade_requests 
SET coin_type = 'BTC' 
WHERE coin_type NOT IN ('BTC', 'ETH', 'USDT');

-- Step 5: Fix invalid rates (rates that are too low)
UPDATE public.trade_requests 
SET rate = CASE 
    WHEN coin_type = 'BTC' AND rate < 100000000 THEN 150000000  -- ₦150M for BTC
    WHEN coin_type = 'ETH' AND rate < 1000000 THEN 5000000      -- ₦5M for ETH  
    WHEN coin_type = 'USDT' AND rate < 500 THEN 750             -- ₦750 for USDT
    ELSE rate
END
WHERE rate < 1000;  -- Fix obviously wrong rates

-- Step 6: Show cleaned up trade requests
SELECT 
    COUNT(*) as total_requests,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as open_requests
FROM public.trade_requests;

-- Step 7: Show current trade requests after cleanup
SELECT 
    id,
    user_id,
    trade_type,
    coin_type,
    amount,
    naira_amount,
    rate,
    status,
    created_at
FROM public.trade_requests 
ORDER BY created_at DESC
LIMIT 10;
