-- Setup test accounts for Google Play Store review
-- Run this in your Supabase SQL editor

-- Create reviewer profile
INSERT INTO profiles (
  user_id, 
  display_name, 
  phone_number, 
  bio, 
  location, 
  user_type,
  is_merchant,
  profile_completed,
  created_at
) VALUES (
  'reviewer-user-id', -- Replace with actual auth user ID
  'Play Store Reviewer',
  '+1234567890',
  'Test account for Google Play Store review',
  'Lagos, Nigeria',
  'customer',
  false,
  true,
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  profile_completed = true;

-- Create merchant reviewer profile  
INSERT INTO profiles (
  user_id,
  display_name,
  phone_number,
  bio,
  location,
  user_type,
  is_merchant,
  profile_completed,
  created_at
) VALUES (
  'merchant-reviewer-user-id', -- Replace with actual auth user ID
  'Merchant Reviewer',
  '+1234567891',
  'Merchant test account for review',
  'Lagos, Nigeria', 
  'merchant',
  true,
  true,
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  is_merchant = true,
  profile_completed = true;

-- Create admin reviewer profile
INSERT INTO profiles (
  user_id,
  display_name,
  phone_number,
  bio,
  location,
  user_type,
  role,
  profile_completed,
  created_at
) VALUES (
  'admin-reviewer-user-id', -- Replace with actual auth user ID
  'Admin Reviewer',
  '+1234567892',
  'Admin test account for review',
  'Lagos, Nigeria',
  'admin',
  'admin',
  true,
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = 'admin',
  profile_completed = true;

-- Add test credits to reviewer accounts
INSERT INTO user_credits (user_id, credits, created_at) VALUES
('reviewer-user-id', 100, NOW()),
('merchant-reviewer-user-id', 100, NOW()),
('admin-reviewer-user-id', 1000, NOW())
ON CONFLICT (user_id) DO UPDATE SET
  credits = EXCLUDED.credits;

-- Create sample trade data for testing
INSERT INTO trades (
  id,
  buyer_id,
  seller_id,
  amount,
  crypto_type,
  naira_amount,
  rate,
  status,
  created_at
) VALUES (
  gen_random_uuid(),
  'reviewer-user-id',
  'merchant-reviewer-user-id',
  0.001,
  'BTC',
  1650,
  1650000,
  'completed',
  NOW() - INTERVAL '1 day'
) ON CONFLICT DO NOTHING;

-- Create sample notifications
INSERT INTO notifications (
  user_id,
  title,
  message,
  type,
  read,
  created_at
) VALUES 
('reviewer-user-id', 'Welcome to Central Exchange', 'Your account has been set up for testing', 'system', false, NOW()),
('merchant-reviewer-user-id', 'Merchant Account Active', 'You can now accept trade requests', 'system', false, NOW()),
('admin-reviewer-user-id', 'Admin Access Granted', 'Full admin privileges enabled', 'system', false, NOW())
ON CONFLICT DO NOTHING;