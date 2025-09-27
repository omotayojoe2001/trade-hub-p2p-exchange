-- Quick check of vendor data
SELECT 'All vendors:' as info;
SELECT * FROM public.vendors;

SELECT 'Vendor for user 1c28d739-980f-4a67-bfd8-188ca05a586c:' as info;
SELECT * FROM public.vendors WHERE user_id = '1c28d739-980f-4a67-bfd8-188ca05a586c';

SELECT 'Profile for this user:' as info;
SELECT * FROM public.profiles WHERE user_id = '1c28d739-980f-4a67-bfd8-188ca05a586c';