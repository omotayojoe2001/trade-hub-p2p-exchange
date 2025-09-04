-- Final RLS policies and profile function fixes

-- 6. Fix RLS policies for profiles table
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- 7. Allow public viewing of merchant profiles
DROP POLICY IF EXISTS "Public can view merchant profiles" ON profiles;
CREATE POLICY "Public can view merchant profiles" ON profiles
    FOR SELECT USING (is_merchant = true AND (is_active IS NULL OR is_active = true));

-- 8. Fix RLS policies for user_profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own profile" ON user_profiles;
CREATE POLICY "Users can create their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- 9. Allow public viewing of user profiles for trading
DROP POLICY IF EXISTS "Public can view user profiles for trading" ON user_profiles;
CREATE POLICY "Public can view user profiles for trading" ON user_profiles
    FOR SELECT USING (is_active IS NULL OR is_active = true);

-- 10. Update the handle_new_user function to avoid conflicts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create entry in user_profiles table (main table)
  INSERT INTO public.user_profiles (
    user_id, 
    full_name, 
    is_premium, 
    verification_level, 
    kyc_status,
    is_active
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', NEW.email),
    false,
    'basic',
    'pending',
    true
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', NEW.email),
    updated_at = now();

  -- Also create entry in profiles table for compatibility
  INSERT INTO public.profiles (
    user_id, 
    display_name, 
    phone_number, 
    user_type, 
    is_merchant,
    profile_completed,
    is_active
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.raw_user_meta_data ->> 'phone_number',
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'customer'),
    COALESCE((NEW.raw_user_meta_data ->> 'user_type') = 'merchant', false),
    true,
    true
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    updated_at = now();

  RETURN NEW;
END;
$$;