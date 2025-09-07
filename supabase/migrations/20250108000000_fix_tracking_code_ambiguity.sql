-- Fix the ambiguous tracking_code column reference in generate_cash_order_tracking_code function
-- The issue is that the variable name 'tracking_code' conflicts with the column name 'tracking_code'

CREATE OR REPLACE FUNCTION generate_cash_order_tracking_code(order_type TEXT)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    year_part TEXT;
    random_part TEXT;
    generated_code TEXT;  -- Changed variable name to avoid ambiguity
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
    generated_code := prefix || '-' || year_part || '-' || random_part;
    
    -- Ensure uniqueness - now properly qualified column reference
    WHILE EXISTS (SELECT 1 FROM cash_order_tracking WHERE cash_order_tracking.tracking_code = generated_code) LOOP
        random_part := LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0');
        generated_code := prefix || '-' || year_part || '-' || random_part;
    END LOOP;
    
    RETURN generated_code;
END;
$$ LANGUAGE plpgsql;
