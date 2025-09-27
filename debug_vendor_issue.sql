-- Debug vendor issue and restore data

-- Check if vendors table exists and has data
SELECT 'vendors table check' as debug_step;
SELECT COUNT(*) as vendor_count FROM public.vendors;
SELECT * FROM public.vendors LIMIT 5;

-- Check if the specific vendor exists
SELECT 'specific vendor check' as debug_step;
SELECT * FROM public.vendors WHERE user_id = '1c28d739-980f-4a67-bfd8-188ca05a586c';

-- Check profiles table for vendor role
SELECT 'profiles check' as debug_step;
SELECT user_id, role, display_name FROM public.profiles WHERE user_id = '1c28d739-980f-4a67-bfd8-188ca05a586c';

-- Check if there are any vendor_jobs without proper vendor records
SELECT 'orphaned vendor jobs check' as debug_step;
SELECT vj.*, v.user_id as vendor_user_id 
FROM public.vendor_jobs vj 
LEFT JOIN public.vendors v ON v.id = vj.vendor_id 
WHERE v.id IS NULL
LIMIT 10;

-- Restore missing vendor record if needed
INSERT INTO public.vendors (
    user_id,
    display_name,
    bank_account,
    bank_name,
    phone,
    active
)
SELECT 
    '1c28d739-980f-4a67-bfd8-188ca05a586c',
    COALESCE(p.display_name, 'Vendor User'),
    '1234567890',
    'First Bank',
    COALESCE(p.phone_number, '+234 800 000 0000'),
    true
FROM public.profiles p 
WHERE p.user_id = '1c28d739-980f-4a67-bfd8-188ca05a586c'
AND NOT EXISTS (
    SELECT 1 FROM public.vendors v WHERE v.user_id = '1c28d739-980f-4a67-bfd8-188ca05a586c'
);

-- Update profile role to vendor if needed
UPDATE public.profiles 
SET role = 'vendor' 
WHERE user_id = '1c28d739-980f-4a67-bfd8-188ca05a586c' 
AND (role IS NULL OR role = 'user');

-- Check final state
SELECT 'final check' as debug_step;
SELECT v.*, p.role 
FROM public.vendors v 
JOIN public.profiles p ON p.user_id = v.user_id 
WHERE v.user_id = '1c28d739-980f-4a67-bfd8-188ca05a586c';