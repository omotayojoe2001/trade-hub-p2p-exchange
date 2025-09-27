-- Add sample payment methods for existing vendors only
-- First, let's see what vendors exist
SELECT id, user_id, display_name, email FROM vendors WHERE user_id IS NOT NULL LIMIT 5;

-- Insert payment methods only for existing vendor user_ids
INSERT INTO payment_methods (user_id, account_number, bank_name, account_name, is_default, is_active)
SELECT 
    v.user_id,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY v.created_at) = 1 THEN '0123456789'
        WHEN ROW_NUMBER() OVER (ORDER BY v.created_at) = 2 THEN '0987654321'
        WHEN ROW_NUMBER() OVER (ORDER BY v.created_at) = 3 THEN '0555666777'
        ELSE '1111222233'
    END as account_number,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY v.created_at) = 1 THEN 'GTBank'
        WHEN ROW_NUMBER() OVER (ORDER BY v.created_at) = 2 THEN 'Access Bank'
        WHEN ROW_NUMBER() OVER (ORDER BY v.created_at) = 3 THEN 'Zenith Bank'
        ELSE 'First Bank'
    END as bank_name,
    v.display_name as account_name,
    true as is_default,
    true as is_active
FROM vendors v 
WHERE v.user_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Show what we have
SELECT pm.*, v.display_name as vendor_name 
FROM payment_methods pm 
LEFT JOIN vendors v ON v.user_id = pm.user_id 
ORDER BY pm.created_at DESC;