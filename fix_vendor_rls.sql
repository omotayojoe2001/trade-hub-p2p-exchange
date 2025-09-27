-- Fix vendor RLS policies
DROP POLICY IF EXISTS "vendors_select_policy" ON public.vendors;
CREATE POLICY "vendors_select_policy" ON public.vendors 
FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'vendor'))
);

-- Also allow vendors to see their own records
DROP POLICY IF EXISTS "vendors_own_records" ON public.vendors;
CREATE POLICY "vendors_own_records" ON public.vendors 
FOR ALL USING (auth.uid() = user_id);