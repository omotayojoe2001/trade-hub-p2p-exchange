-- Fix cash order tracking table and RLS policies

-- Create cash_order_tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cash_order_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vendor_job_id UUID REFERENCES public.vendor_jobs(id) ON DELETE SET NULL,
    tracking_code TEXT UNIQUE NOT NULL,
    naira_amount DECIMAL(20,2) NOT NULL,
    usd_amount DECIMAL(20,2) NOT NULL,
    service_fee DECIMAL(20,2) DEFAULT 0,
    order_type TEXT NOT NULL CHECK (order_type IN ('naira_to_usd_pickup', 'naira_to_usd_delivery')),
    delivery_details JSONB,
    contact_details JSONB,
    payment_proof_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'payment_submitted', 'payment_confirmed', 'delivery_in_progress', 'completed', 'cancelled')),
    vendor_confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cash_order_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "cash_order_tracking_select_policy" ON public.cash_order_tracking;
DROP POLICY IF EXISTS "cash_order_tracking_insert_policy" ON public.cash_order_tracking;
DROP POLICY IF EXISTS "cash_order_tracking_update_policy" ON public.cash_order_tracking;

-- Create RLS policies
CREATE POLICY "cash_order_tracking_select_policy" ON public.cash_order_tracking 
FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM public.vendor_jobs vj 
        JOIN public.vendors v ON v.id = vj.vendor_id 
        WHERE vj.id = vendor_job_id AND v.user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "cash_order_tracking_insert_policy" ON public.cash_order_tracking 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cash_order_tracking_update_policy" ON public.cash_order_tracking 
FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM public.vendor_jobs vj 
        JOIN public.vendors v ON v.id = vj.vendor_id 
        WHERE vj.id = vendor_job_id AND v.user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create function to create cash order with vendor assignment
CREATE OR REPLACE FUNCTION create_cash_order_with_vendor(
    p_user_id UUID,
    p_naira_amount DECIMAL,
    p_usd_amount DECIMAL,
    p_service_fee DECIMAL,
    p_order_type TEXT,
    p_delivery_details JSONB,
    p_contact_details JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tracking_code TEXT;
    v_cash_order_id UUID;
    v_vendor_id UUID;
    v_vendor_job_id UUID;
    v_verification_code TEXT;
BEGIN
    -- Generate tracking code
    v_tracking_code := 'CO' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Ensure unique tracking code
    WHILE EXISTS (SELECT 1 FROM public.cash_order_tracking WHERE tracking_code = v_tracking_code) LOOP
        v_tracking_code := 'CO' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    END LOOP;
    
    -- Get first available vendor
    SELECT id INTO v_vendor_id 
    FROM public.vendors 
    WHERE active = true 
    ORDER BY created_at 
    LIMIT 1;
    
    IF v_vendor_id IS NULL THEN
        RAISE EXCEPTION 'No active vendors available';
    END IF;
    
    -- Generate verification code
    v_verification_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Create cash order tracking
    INSERT INTO public.cash_order_tracking (
        user_id,
        tracking_code,
        naira_amount,
        usd_amount,
        service_fee,
        order_type,
        delivery_details,
        contact_details,
        status
    ) VALUES (
        p_user_id,
        v_tracking_code,
        p_naira_amount,
        p_usd_amount,
        p_service_fee,
        p_order_type,
        p_delivery_details,
        p_contact_details,
        'pending'
    ) RETURNING id INTO v_cash_order_id;
    
    -- Create vendor job
    INSERT INTO public.vendor_jobs (
        vendor_id,
        premium_user_id,
        amount_usd,
        delivery_type,
        status,
        verification_code,
        cash_order_id,
        order_type
    ) VALUES (
        v_vendor_id,
        p_user_id,
        p_usd_amount,
        CASE 
            WHEN p_order_type = 'naira_to_usd_pickup' THEN 'pickup'
            WHEN p_order_type = 'naira_to_usd_delivery' THEN 'delivery'
            ELSE 'naira_to_usd'
        END,
        'pending_payment',
        v_verification_code,
        v_cash_order_id,
        'naira_to_usd'
    ) RETURNING id INTO v_vendor_job_id;
    
    -- Update cash order with vendor job reference
    UPDATE public.cash_order_tracking 
    SET vendor_job_id = v_vendor_job_id 
    WHERE id = v_cash_order_id;
    
    -- Notify vendor about new order
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        data
    )
    SELECT 
        v.user_id,
        'new_cash_order',
        'New Cash Order Received',
        'You have received a new ' || p_order_type || ' order for $' || p_usd_amount || '. Order ID: ' || v_tracking_code,
        jsonb_build_object(
            'cash_order_id', v_cash_order_id,
            'vendor_job_id', v_vendor_job_id,
            'tracking_code', v_tracking_code,
            'amount_usd', p_usd_amount,
            'order_type', p_order_type
        )
    FROM public.vendors v
    WHERE v.id = v_vendor_id;
    
    RETURN v_cash_order_id;
END;
$$;

-- Add cash_order_id column to vendor_jobs if it doesn't exist
ALTER TABLE public.vendor_jobs ADD COLUMN IF NOT EXISTS cash_order_id UUID REFERENCES public.cash_order_tracking(id) ON DELETE SET NULL;
ALTER TABLE public.vendor_jobs ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'crypto_to_cash';

-- Fix vendor job status constraint
ALTER TABLE public.vendor_jobs DROP CONSTRAINT IF EXISTS vendor_jobs_status_check;
ALTER TABLE public.vendor_jobs ADD CONSTRAINT vendor_jobs_status_check 
CHECK (status IN ('pending_payment', 'payment_received', 'payment_confirmed', 'awaiting_handoff', 'completed', 'cancelled', 'dispute'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cash_order_tracking_user_id ON public.cash_order_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_order_tracking_vendor_job_id ON public.cash_order_tracking(vendor_job_id);
CREATE INDEX IF NOT EXISTS idx_cash_order_tracking_tracking_code ON public.cash_order_tracking(tracking_code);
CREATE INDEX IF NOT EXISTS idx_cash_order_tracking_status ON public.cash_order_tracking(status);

-- Add update trigger
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_cash_order_tracking_updated_at ON public.cash_order_tracking;
        CREATE TRIGGER update_cash_order_tracking_updated_at
            BEFORE UPDATE ON public.cash_order_tracking
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;