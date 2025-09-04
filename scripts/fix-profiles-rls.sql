-- Fix RLS policies for profiles table to allow profile creation

-- Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Temporarily disable RLS for testing (ONLY FOR DEBUGGING)
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Or create proper RLS policies that allow profile creation
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow public read access for merchant discovery
DROP POLICY IF EXISTS "Public can view merchant profiles" ON profiles;
CREATE POLICY "Public can view merchant profiles" ON profiles
    FOR SELECT USING (is_merchant = true);

-- Check if policies were created successfully
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Test profile creation (replace with actual user ID)
-- INSERT INTO profiles (user_id, display_name, user_type, is_merchant, profile_completed)
-- VALUES ('your-user-id-here', 'Test User', 'customer', false, true);
