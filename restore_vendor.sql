-- Restore vendor record
INSERT INTO public.vendors (
    user_id,
    display_name,
    bank_account,
    bank_name,
    phone,
    active
) VALUES (
    '1c28d739-980f-4a67-bfd8-188ca05a586c',
    'Test Vendor',
    '1234567890',
    'First Bank',
    '+234 800 000 0000',
    true
) ON CONFLICT (user_id) DO UPDATE SET
    active = true,
    updated_at = now();

-- Set vendor role
UPDATE public.profiles 
SET role = 'vendor' 
WHERE user_id = '1c28d739-980f-4a67-bfd8-188ca05a586c';