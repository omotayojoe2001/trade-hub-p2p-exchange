-- Just check what vendors exist
SELECT * FROM public.vendors;

-- Check specific user
SELECT * FROM public.vendors WHERE user_id = '1c28d739-980f-4a67-bfd8-188ca05a586c';

-- Check profile role
SELECT user_id, role FROM public.profiles WHERE user_id = '1c28d739-980f-4a67-bfd8-188ca05a586c';