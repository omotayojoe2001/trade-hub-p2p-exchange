-- Create tables for Send Naira Get Cash flow with vendor integration

-- Update vendor_jobs table to support Send Naira -> Get Cash orders
ALTER TABLE vendor_jobs 
ADD COLUMN IF NOT EXISTS naira_amount_paid NUMERIC,
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tracking_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'crypto_delivery';

-- Create tracking codes table for Send Naira Get Cash
CREATE TABLE IF NOT EXISTS cash_order_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  vendor_job_id UUID REFERENCES vendor_jobs(id),
  tracking_code TEXT UNIQUE NOT NULL,
  order_type TEXT NOT NULL, -- 'naira_to_usd_pickup' or 'naira_to_usd_delivery'
  naira_amount NUMERIC NOT NULL,
  usd_amount NUMERIC NOT NULL,
  service_fee NUMERIC NOT NULL DEFAULT 0,
  delivery_details JSONB,
  contact_details JSONB,
  status TEXT DEFAULT 'payment_pending',
  payment_proof_url TEXT,
  vendor_confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for cash_order_tracking
ALTER TABLE cash_order_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policies for cash_order_tracking
CREATE POLICY "cash_order_tracking_user_policy" ON cash_order_tracking
  FOR ALL USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM vendors v 
      INNER JOIN vendor_jobs vj ON v.id = vj.vendor_id 
      WHERE vj.id = cash_order_tracking.vendor_job_id 
      AND v.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to generate tracking codes for cash orders
CREATE OR REPLACE FUNCTION generate_cash_order_tracking_code(order_type TEXT)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    year_part TEXT;
    random_part TEXT;
    tracking_code TEXT;
BEGIN
    -- Set prefix based on order type
    IF order_type = 'naira_to_usd_pickup' THEN
        prefix := 'NUP';
    ELSIF order_type = 'naira_to_usd_delivery' THEN
        prefix := 'NUD';
    ELSE
        prefix := 'NCO';
    END IF;
    
    -- Get current year (last 2 digits)
    year_part := RIGHT(EXTRACT(YEAR FROM NOW())::TEXT, 2);
    
    -- Generate random 4-digit number
    random_part := LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0');
    
    -- Combine parts
    tracking_code := prefix || '-' || year_part || '-' || random_part;
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM cash_order_tracking WHERE tracking_code = tracking_code) LOOP
        random_part := LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0');
        tracking_code := prefix || '-' || year_part || '-' || random_part;
    END LOOP;
    
    RETURN tracking_code;
END;
$$ LANGUAGE plpgsql;

-- Function to create cash order with vendor assignment
CREATE OR REPLACE FUNCTION create_cash_order_with_vendor(
  p_user_id UUID,
  p_naira_amount NUMERIC,
  p_usd_amount NUMERIC,
  p_service_fee NUMERIC,
  p_order_type TEXT,
  p_delivery_details JSONB,
  p_contact_details JSONB
) RETURNS UUID AS $$
DECLARE
  v_vendor_id UUID;
  v_vendor_job_id UUID;
  v_tracking_code TEXT;
  v_order_id UUID;
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
  
  -- Generate tracking code
  v_tracking_code := generate_cash_order_tracking_code(p_order_type);
  
  -- Create vendor job
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
    'payment_pending',
    p_delivery_details,
    v_tracking_code,
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
    'payment_pending'
  ) RETURNING id INTO v_order_id;
  
  -- Notify vendor about new cash order
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    v.user_id,
    'cash_order_request',
    'New Cash Order Request',
    'Premium user needs ' || p_order_type || ' for $' || p_usd_amount,
    jsonb_build_object(
      'vendor_job_id', v_vendor_job_id,
      'tracking_code', v_tracking_code,
      'naira_amount', p_naira_amount,
      'usd_amount', p_usd_amount,
      'order_type', p_order_type
    )
  FROM vendors v
  WHERE v.id = v_vendor_id;
  
  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_cash_order_tracking_updated_at
  BEFORE UPDATE ON cash_order_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();