-- Fix critical security issues and function search paths

-- Set proper search path for all functions to prevent security issues
ALTER FUNCTION public.generate_tracking_code(text) SET search_path = public;
ALTER FUNCTION public.assign_agent(text, text) SET search_path = public;
ALTER FUNCTION public.notify_new_trade_request() SET search_path = public;
ALTER FUNCTION public.generate_cash_order_tracking_code(text) SET search_path = public;
ALTER FUNCTION public.notify_delivery_update() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.create_welcome_notification() SET search_path = public;
ALTER FUNCTION public.get_user_recent_trades(uuid) SET search_path = public;
ALTER FUNCTION public.get_trade_messages(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.update_merchant_ratings(uuid) SET search_path = public;
ALTER FUNCTION public.clean_expired_trade_progress() SET search_path = public;
ALTER FUNCTION public.calculate_platform_fee(numeric, numeric) SET search_path = public;
ALTER FUNCTION public.grant_premium_credits() SET search_path = public;
ALTER FUNCTION public.auto_match_trade_request(uuid, numeric, text) SET search_path = public;
ALTER FUNCTION public.notify_trade_accepted() SET search_path = public;
ALTER FUNCTION public.get_available_trade_requests(uuid) SET search_path = public;
ALTER FUNCTION public.notify_vendor_cash_order() SET search_path = public;
ALTER FUNCTION public.create_cash_order_with_vendor(uuid, numeric, numeric, numeric, text, jsonb, jsonb) SET search_path = public;
ALTER FUNCTION public.create_trade_request(uuid, text, numeric, numeric, numeric, text, text) SET search_path = public;
ALTER FUNCTION public.create_premium_trade_request(uuid, text, numeric, numeric, numeric, text, text, boolean) SET search_path = public;
ALTER FUNCTION public.generate_trade_code() SET search_path = public;
ALTER FUNCTION public.create_premium_trade_with_vendor(uuid, numeric, text, jsonb) SET search_path = public;
ALTER FUNCTION public.notify_vendor_job_created() SET search_path = public;
ALTER FUNCTION public.notify_merchant_of_trade(uuid, uuid, numeric) SET search_path = public;
ALTER FUNCTION public.get_credit_balance(uuid) SET search_path = public;
ALTER FUNCTION public.create_vendor_user(text, text, text, text, text, text, text) SET search_path = public;
ALTER FUNCTION public.update_credit_balance(uuid, integer) SET search_path = public;
ALTER FUNCTION public.create_profile_for_new_user() SET search_path = public;
ALTER FUNCTION public.grant_premium_credits_safe() SET search_path = public;
ALTER FUNCTION public.create_premium_trade_request(uuid, numeric, text) SET search_path = public;

-- Fix potential null user_id issues in key tables
-- Ensure user_id columns that are used in RLS are NOT NULL where appropriate
ALTER TABLE public.notifications ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.trade_requests ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.cash_order_tracking ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.vendor_jobs ALTER COLUMN premium_user_id SET NOT NULL;