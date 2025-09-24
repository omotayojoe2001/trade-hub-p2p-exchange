-- Create function to add credits to user account
CREATE OR REPLACE FUNCTION add_user_credits(user_id_param UUID, credits_amount INTEGER, description_text TEXT DEFAULT 'Credit purchase')
RETURNS BOOLEAN AS $$
BEGIN
    -- Update user credits
    UPDATE profiles 
    SET credits = COALESCE(credits, 0) + credits_amount
    WHERE user_id = user_id_param;
    
    -- Record transaction
    INSERT INTO credit_transactions (user_id, type, amount, description)
    VALUES (user_id_param, 'purchase', credits_amount, description_text);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to spend credits
CREATE OR REPLACE FUNCTION spend_user_credits(user_id_param UUID, credits_amount INTEGER, description_text TEXT DEFAULT 'Credit spent')
RETURNS BOOLEAN AS $$
DECLARE
    current_credits INTEGER;
BEGIN
    -- Get current credits
    SELECT COALESCE(credits, 0) INTO current_credits
    FROM profiles 
    WHERE user_id = user_id_param;
    
    -- Check if user has enough credits
    IF current_credits < credits_amount THEN
        RETURN FALSE;
    END IF;
    
    -- Deduct credits
    UPDATE profiles 
    SET credits = credits - credits_amount
    WHERE user_id = user_id_param;
    
    -- Record transaction
    INSERT INTO credit_transactions (user_id, type, amount, description)
    VALUES (user_id_param, 'spend', -credits_amount, description_text);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION add_user_credits TO authenticated;
GRANT EXECUTE ON FUNCTION spend_user_credits TO authenticated;