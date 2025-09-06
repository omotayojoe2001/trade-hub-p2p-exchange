-- Drop existing policy and recreate 
DROP POLICY IF EXISTS "merchant_notifications_policy" ON public.merchant_notifications;

-- Create RLS policy for merchant_notifications without conflicts
CREATE POLICY "merchant_notifications_access_policy" ON public.merchant_notifications
    FOR ALL USING (
        auth.uid() = merchant_id OR 
        EXISTS (
            SELECT 1 FROM public.trade_requests tr 
            WHERE tr.id = trade_request_id AND tr.user_id = auth.uid()
        )
    );