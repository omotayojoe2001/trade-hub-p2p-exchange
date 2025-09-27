-- Fix Send Naira Get USD to use cash_trades table (same as sell-for-cash)

-- Update the function to create cash_trades records instead of vendor_jobs
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
    v_vendor_user_id UUID;
    v_vendor_id UUID;
    v_cash_trade_id UUID;
    v_delivery_code TEXT;
BEGIN
    -- Generate tracking code
    v_tracking_code := 'CO' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Ensure unique tracking code
    WHILE EXISTS (SELECT 1 FROM public.cash_order_tracking WHERE tracking_code = v_tracking_code) LOOP
        v_tracking_code := 'CO' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    END LOOP;
    
    -- Get first available vendor (both user_id and vendor table id)
    SELECT user_id, id INTO v_vendor_user_id, v_vendor_id
    FROM public.vendors 
    WHERE active = true 
    ORDER BY created_at 
    LIMIT 1;
    
    IF v_vendor_user_id IS NULL THEN
        RAISE EXCEPTION 'No active vendors available';
    END IF;
    
    -- Generate delivery code (6 digits)
    v_delivery_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Create cash order tracking (for customer)
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
    
    -- Create cash_trades record (for vendor) - same table as sell-for-cash
    INSERT INTO public.cash_trades (
        vendor_id,
        seller_id,
        buyer_id,
        usd_amount,
        delivery_type,
        delivery_address,
        pickup_location,
        delivery_code,
        seller_phone,
        status,
        trade_request_id,
        merchant_name
    ) VALUES (
        v_vendor_id,
        p_user_id,
        p_user_id,
        p_usd_amount,
        CASE 
            WHEN p_order_type = 'naira_to_usd_pickup' THEN 'pickup'
            WHEN p_order_type = 'naira_to_usd_delivery' THEN 'delivery'
            ELSE 'pickup'
        END,
        CASE 
            WHEN p_order_type = 'naira_to_usd_delivery' THEN 
                COALESCE(p_delivery_details->>'address', 'Delivery Address')
            ELSE NULL
        END,
        CASE 
            WHEN p_order_type = 'naira_to_usd_pickup' THEN 
                COALESCE(p_delivery_details->>'pickup_location', 'Pickup Location')
            ELSE NULL
        END,
        v_delivery_code,
        p_contact_details->>'phoneNumber',
        'vendor_paid', -- Start with vendor_paid status (payment submitted)
        NULL, -- Send Naira orders don't have trade_request_id
        'Send Naira Customer' -- Identify as Send Naira order
    ) RETURNING id INTO v_cash_trade_id;
    
    -- Note: Don't update vendor_job_id since Send Naira uses cash_trades, not vendor_jobs
    
    -- Notify vendor about new order
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        data
    ) VALUES (
        v_vendor_user_id,
        'new_cash_delivery',
        'New Cash Delivery Request',
        'You have received a new ' || p_order_type || ' request for $' || p_usd_amount || '. Order: ' || v_tracking_code,
        jsonb_build_object(
            'cash_order_id', v_cash_order_id,
            'cash_trade_id', v_cash_trade_id,
            'tracking_code', v_tracking_code,
            'amount_usd', p_usd_amount,
            'order_type', p_order_type,
            'delivery_code', v_delivery_code
        )
    );
    
    RETURN v_cash_order_id;
END;
$$;