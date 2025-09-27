-- Add payment methods for actual merchant users (not vendors)
-- Check what merchants exist in the system
SELECT id, email, raw_user_meta_data->>'display_name' as display_name FROM auth.users LIMIT 5;

-- Add payment methods for existing users
INSERT INTO payment_methods (user_id, account_number, bank_name, account_name, is_default, is_active)
SELECT 
    u.id,
    '0123456789',
    'GTBank',
    COALESCE(u.raw_user_meta_data->>'display_name', 'Demo Merchant'),
    true,
    true
FROM auth.users u 
WHERE u.id IS NOT NULL
LIMIT 3
ON CONFLICT DO NOTHING;

-- Show what we have
SELECT pm.*, u.email, u.raw_user_meta_data->>'display_name' as user_name
FROM payment_methods pm 
LEFT JOIN auth.users u ON u.id = pm.user_id 
ORDER BY pm.created_at DESC;