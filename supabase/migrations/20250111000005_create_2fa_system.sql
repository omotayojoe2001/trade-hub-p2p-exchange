-- Create user_2fa table for two-factor authentication
CREATE TABLE IF NOT EXISTS public.user_2fa (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  backup_codes TEXT[] NOT NULL DEFAULT '{}',
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own 2FA settings" ON public.user_2fa FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own 2FA settings" ON public.user_2fa FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own 2FA settings" ON public.user_2fa FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own 2FA settings" ON public.user_2fa FOR DELETE USING (auth.uid() = user_id);

-- Add 2FA columns to profiles table if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS backup_codes TEXT[];

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_2fa_enabled ON public.user_2fa(user_id, is_enabled);