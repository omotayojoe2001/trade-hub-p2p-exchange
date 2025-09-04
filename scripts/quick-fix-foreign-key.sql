-- Quick fix for foreign key constraint error
-- Run this first to clean up the issue

-- Step 1: Drop the problematic foreign key constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'trade_requests_user_id_fkey' 
        AND table_name = 'trade_requests'
    ) THEN
        ALTER TABLE public.trade_requests DROP CONSTRAINT trade_requests_user_id_fkey;
        RAISE NOTICE 'Dropped existing foreign key constraint';
    END IF;
END $$;

-- Step 2: Clean up any invalid data
DELETE FROM public.trade_requests 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Step 3: Check what data remains
SELECT 
    COUNT(*) as total_requests,
    COUNT(DISTINCT user_id) as unique_users
FROM public.trade_requests;

-- Step 4: Show any remaining invalid user_ids (should be empty after cleanup)
SELECT DISTINCT user_id 
FROM public.trade_requests 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Step 5: Only add foreign key constraint if data is clean
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    -- Check for invalid user_ids
    SELECT COUNT(*) INTO invalid_count 
    FROM public.trade_requests 
    WHERE user_id NOT IN (SELECT id FROM auth.users);
    
    IF invalid_count = 0 THEN
        -- Safe to add foreign key constraint
        ALTER TABLE public.trade_requests 
        ADD CONSTRAINT trade_requests_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'SUCCESS: Foreign key constraint added successfully';
    ELSE
        RAISE NOTICE 'WARNING: % invalid user_ids found - foreign key not added', invalid_count;
        RAISE NOTICE 'Run the cleanup again or check your data';
    END IF;
END $$;
