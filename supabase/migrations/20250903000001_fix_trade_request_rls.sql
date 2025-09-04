-- Fix RLS policies for trade requests to allow merchants to accept trades

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own trade requests" ON public.trade_requests;
DROP POLICY IF EXISTS "Users can update their own trade requests" ON public.trade_requests;

-- Create new policies that allow merchants to view and accept trade requests
CREATE POLICY "Users can view trade requests"
  ON public.trade_requests FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() = merchant_id OR
    status = 'pending'
  );

CREATE POLICY "Users can update trade requests"
  ON public.trade_requests FOR UPDATE
  USING (
    auth.uid() = user_id OR
    (status = 'pending' AND auth.uid() IS NOT NULL)
  );

-- Allow merchants to accept trade requests by updating merchant_id and status
CREATE POLICY "Merchants can accept open trade requests"
  ON public.trade_requests FOR UPDATE
  USING (status = 'pending' AND auth.uid() IS NOT NULL)
  WITH CHECK (
    status IN ('accepted', 'rejected') AND
    merchant_id = auth.uid()
  );

-- Ensure notifications can be created for trade events
CREATE POLICY "System can create notifications" 
  ON public.notifications FOR INSERT 
  WITH CHECK (true);
