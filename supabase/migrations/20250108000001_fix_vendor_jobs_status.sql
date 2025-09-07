-- Fix the vendor_jobs status constraint issue
-- The function is trying to insert 'payment_pending' but constraint only allows 'pending_payment'

CREATE OR REPLACE FUNCTION public.create_cash_order_with_vendor(
  p_user_id uuid, 
  p_naira_amount numeric, 
  p_usd_amount numeric, 
  p_service_fee numeric, 
  p_order_type text, 
  p_delivery_details jsonb, 
  p_contact_details jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $function$
DECLARE
  v_vendor_id UUID;
  v_vendor_job_id UUID;
  v_tracking_code TEXT;
  v_order_id UUID;
  v_verification_code TEXT;
BEGIN
  -- Find available vendor
  SELECT id INTO v_vendor_id
  FROM vendors
  WHERE active = true
  ORDER BY RANDOM()
  LIMIT 1;
  
  IF v_vendor_id IS NULL THEN
    RAISE EXCEPTION 'No available vendors found';
  END IF;
  
  -- Generate tracking code and verification code
  v_tracking_code := generate_cash_order_tracking_code(p_order_type);
  v_verification_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  -- Create vendor job first
  INSERT INTO vendor_jobs (
    vendor_id,
    premium_user_id,
    amount_usd,
    delivery_type,
    status,
    address_json,
    verification_code,
    tracking_code,
    order_type,
    naira_amount_paid
  ) VALUES (
    v_vendor_id,
    p_user_id,
    p_usd_amount,
    CASE 
      WHEN p_order_type = 'naira_to_usd_pickup' THEN 'pickup'
      WHEN p_order_type = 'naira_to_usd_delivery' THEN 'delivery'
      ELSE 'delivery'
    END,
    'pending_payment',  -- Fixed: was 'payment_pending', now 'pending_payment'
    p_delivery_details,
    v_verification_code,
    v_tracking_code,
    'naira_to_usd',
    p_naira_amount
  ) RETURNING id INTO v_vendor_job_id;
  
  -- Create cash order tracking
  INSERT INTO cash_order_tracking (
    user_id,
    vendor_job_id,
    tracking_code,
    order_type,
    naira_amount,
    usd_amount,
    service_fee,
    delivery_details,
    contact_details,
    status
  ) VALUES (
    p_user_id,
    v_vendor_job_id,
    v_tracking_code,
    p_order_type,
    p_naira_amount,
    p_usd_amount,
    p_service_fee,
    p_delivery_details,
    p_contact_details,
    'payment_pending'  -- This can stay as 'payment_pending' since it's a different table
  ) RETURNING id INTO v_order_id;
  
  -- Update vendor job with cash order reference
  UPDATE vendor_jobs 
  SET cash_order_id = v_order_id
  WHERE id = v_vendor_job_id;
  
  -- Notify vendor about new cash order immediately
  INSERT INTO public.notifications (user_id, type, title, message, data)
  SELECT 
    v.user_id,
    'cash_order_request',
    'New Cash Order Request',
    'Premium user needs ' || 
    CASE 
        WHEN p_order_type = 'naira_to_usd_pickup' THEN 'USD pickup'
        WHEN p_order_type = 'naira_to_usd_delivery' THEN 'USD delivery'
        ELSE 'cash service'
    END || 
    ' for $' || p_usd_amount,
    jsonb_build_object(
        'cash_order_id', v_order_id,
        'tracking_code', v_tracking_code,
        'naira_amount', p_naira_amount,
        'usd_amount', p_usd_amount,
        'order_type', p_order_type,
        'vendor_job_id', v_vendor_job_id
    )
  FROM vendors v
  WHERE v.id = v_vendor_id;
  
  RETURN v_order_id;
END;
$function$;
