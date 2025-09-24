# Quick Credits Setup

## 1. Run this SQL in Supabase Dashboard:

```sql
-- Add credits column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;

-- Update existing users to have 0 credits
UPDATE profiles SET credits = 0 WHERE credits IS NULL;

-- Create credit functions
CREATE OR REPLACE FUNCTION add_user_credits(user_id_param UUID, credits_amount INTEGER, description_text TEXT DEFAULT 'Credit purchase')
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE profiles 
    SET credits = COALESCE(credits, 0) + credits_amount
    WHERE user_id = user_id_param;
    
    INSERT INTO credit_transactions (user_id, type, amount, description)
    VALUES (user_id_param, 'purchase', credits_amount, description_text);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION add_user_credits TO authenticated;
```

## 2. Add Test Credits:

Go to `/test-credits` and click "Add Test Credits" to add 100 credits to your account.

## 3. Check Results:

- Home page should show your credits
- Settings page should show real credits (not hardcoded)
- Credits history should work

## 4. Test Flow:

1. Visit `/test-credits`
2. Add 100 credits
3. Check home page - should show 100 credits
4. Check settings - should show 100 credits
5. Visit `/credits-history` - should show transaction