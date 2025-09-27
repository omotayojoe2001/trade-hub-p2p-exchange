-- Check vendors table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vendors' AND table_schema = 'public';

-- Check existing vendors first
SELECT * FROM public.vendors WHERE user_id = '1c28d739-980f-4a67-bfd8-188ca05a586c';

-- If no vendor exists, insert with name column
INSERT INTO public.vendors (
    user_id,
    name,
    display_name,
    bank_account,
    bank_name,
    active
) 
SELECT 
    '1c28d739-980f-4a67-bfd8-188ca05a586c',
    'Test Vendor',
    'Test Vendor',
    '1234567890',
    'First Bank',
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.vendors WHERE user_id = '1c28d739-980f-4a67-bfd8-188ca05a586c'
);

-- Set vendor role
UPDATE public.profiles 
SET role = 'vendor' 
WHERE user_id = '1c28d739-980f-4a67-bfd8-188ca05a586c';