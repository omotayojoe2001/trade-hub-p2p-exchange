-- Fix RLS policies for trade_requests to prevent merchants from seeing all requests

-- First, check if we need merchant_notifications table to track which merchant gets which request
CREATE TABLE IF NOT EXISTS public.merchant_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_request_id UUID NOT NULL REFERENCES public.trade_requests(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_read BOOLEAN DEFAULT false
);

-- Enable RLS on merchant_notifications
ALTER TABLE public.merchant_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for merchant_notifications
CREATE POLICY "merchant_notifications_policy" ON public.merchant_notifications
    FOR ALL USING (
        auth.uid() = merchant_id OR 
        EXISTS (
            SELECT 1 FROM public.trade_requests tr 
            WHERE tr.id = trade_request_id AND tr.user_id = auth.uid()
        )
    );

-- Update trade_requests RLS to allow merchants to accept requests sent to them
DROP POLICY IF EXISTS "trade_requests_update_policy" ON public.trade_requests;

CREATE POLICY "trade_requests_update_policy" ON public.trade_requests
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.merchant_notifications mn 
            WHERE mn.trade_request_id = trade_requests.id AND mn.merchant_id = auth.uid()
        )
    );

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_merchant_notifications_merchant_id ON public.merchant_notifications(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_notifications_trade_request_id ON public.merchant_notifications(trade_request_id);