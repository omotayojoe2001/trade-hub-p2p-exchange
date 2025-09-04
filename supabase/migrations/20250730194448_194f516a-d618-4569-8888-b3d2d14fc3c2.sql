-- Fix the user profiles trigger to handle missing data gracefully
-- This function creates entries in both profiles and user_profiles tables for compatibility
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Create entry in user_profiles table (main table)
  INSERT INTO public.user_profiles (user_id, full_name, is_premium, verification_level, kyc_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', NEW.email),
    false,
    'basic',
    'pending'
  );

  -- Also create entry in profiles table for compatibility (if it exists)
  BEGIN
    INSERT INTO public.profiles (user_id, display_name, phone_number, user_type, is_merchant)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', NEW.email),
      NEW.raw_user_meta_data ->> 'phone_number',
      COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'customer'),
      COALESCE((NEW.raw_user_meta_data ->> 'user_type') = 'merchant', false)
    );
  EXCEPTION
    WHEN undefined_table THEN
      -- profiles table doesn't exist, that's okay
      NULL;
    WHEN OTHERS THEN
      -- Log error but don't fail the user creation
      RAISE WARNING 'Failed to create profiles entry: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

-- Create profiles table for compatibility with existing code
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone_number TEXT,
  user_type TEXT DEFAULT 'customer' CHECK (user_type IN ('customer', 'merchant')),
  is_merchant BOOLEAN DEFAULT false,
  profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();