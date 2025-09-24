-- Fix user display name function and escrow status issues

-- 1. Drop existing function and recreate with correct return type
DROP FUNCTION IF EXISTS get_user_display_name(UUID);

CREATE FUNCTION get_user_display_name(user_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    display_name TEXT;
BEGIN
    -- Try to get display name from profiles table
    SELECT display_name INTO display_name 
    FROM profiles 
    WHERE user_id = user_id_param;
    
    -- If not found in profiles, try user_profiles table
    IF display_name IS NULL THEN
        SELECT full_name INTO display_name 
        FROM user_profiles 
        WHERE user_id = user_id_param;
    END IF;
    
    -- If still not found, get from auth.users metadata
    IF display_name IS NULL THEN
        SELECT 
            COALESCE(
                raw_user_meta_data->>'display_name',
                raw_user_meta_data->>'full_name',
                email
            ) INTO display_name
        FROM auth.users 
        WHERE id = user_id_param;
    END IF;
    
    RETURN COALESCE(display_name, 'User');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix escrow status constraint - allow all statuses used in the codebase
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_escrow_status_check;
ALTER TABLE trades ADD CONSTRAINT trades_escrow_status_check 
    CHECK (escrow_status IN ('pending', 'escrow_created', 'crypto_received', 'crypto_deposited', 'payment_proof_uploaded', 'cash_received', 'completed', 'disputed'));

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION get_user_display_name TO authenticated;