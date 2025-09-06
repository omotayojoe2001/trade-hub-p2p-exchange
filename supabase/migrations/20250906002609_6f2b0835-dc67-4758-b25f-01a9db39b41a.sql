-- Create missing database function for premium trade requests
CREATE OR REPLACE FUNCTION public.create_premium_trade_request(
  p_user_id UUID,
  p_crypto_type TEXT,
  p_amount_crypto NUMERIC,
  p_amount_fiat NUMERIC,
  p_rate NUMERIC,
  p_trade_type TEXT,
  p_payment_method TEXT,
  p_auto_match BOOLEAN DEFAULT false
)
RETURNS TABLE(
  request_id UUID,
  matched_merchant_id UUID,
  trade_id UUID,
  auto_matched BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id UUID;
  v_merchant_id UUID;
  v_trade_id UUID;
  v_is_premium BOOLEAN;
BEGIN
  -- Check if user is premium
  SELECT COALESCE(is_premium, false) INTO v_is_premium
  FROM public.profiles
  WHERE user_id = p_user_id;

  -- Create the trade request first
  INSERT INTO public.trade_requests (
    user_id, crypto_type, amount_crypto, amount_fiat, rate,
    trade_type, payment_method, status, expires_at
  ) VALUES (
    p_user_id, p_crypto_type, p_amount_crypto, p_amount_fiat, p_rate,
    p_trade_type, p_payment_method, 'open', now() + INTERVAL '24 hours'
  ) RETURNING id INTO v_request_id;

  -- If premium user wants auto-match, try to find a merchant
  IF v_is_premium AND p_auto_match THEN
    -- Find an available merchant
    SELECT user_id INTO v_merchant_id
    FROM public.profiles
    WHERE is_merchant = true 
    AND merchant_mode = true
    AND user_id != p_user_id
    ORDER BY RANDOM()
    LIMIT 1;

    IF v_merchant_id IS NOT NULL THEN
      -- Create the trade automatically
      INSERT INTO public.trades (
        seller_id,
        buyer_id,
        crypto_type,
        amount_crypto,
        amount_fiat,
        rate,
        status,
        trade_type,
        payment_method
      ) VALUES (
        CASE WHEN p_trade_type = 'sell' THEN p_user_id ELSE v_merchant_id END,
        CASE WHEN p_trade_type = 'buy' THEN p_user_id ELSE v_merchant_id END,
        p_crypto_type,
        p_amount_crypto,
        p_amount_fiat,
        p_rate,
        'pending',
        p_trade_type,
        p_payment_method
      ) RETURNING id INTO v_trade_id;

      -- Mark request as matched
      UPDATE public.trade_requests
      SET status = 'matched'
      WHERE id = v_request_id;

      -- Notify both users
      INSERT INTO public.notifications (user_id, title, message, type, data)
      VALUES
      (p_user_id, 'Auto-Match Successful',
       'Your premium trade was automatically matched!', 'trade_matched',
       jsonb_build_object('trade_id', v_trade_id, 'action', 'view_trade')),
      (v_merchant_id, 'New Trade Matched',
       'You have been matched with a premium trader', 'trade_matched',
       jsonb_build_object('trade_id', v_trade_id, 'action', 'view_trade'));

      RETURN QUERY SELECT v_request_id, v_merchant_id, v_trade_id, true, 'Auto-matched successfully!';
    ELSE
      RETURN QUERY SELECT v_request_id, NULL::UUID, NULL::UUID, false, 'No merchants available for auto-match. Request posted manually.';
    END IF;
  ELSE
    RETURN QUERY SELECT v_request_id, NULL::UUID, NULL::UUID, false, 'Trade request posted for manual matching.';
  END IF;
END;
$$;

-- Add missing columns to existing tables
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS crypto_type TEXT DEFAULT 'BTC',
ADD COLUMN IF NOT EXISTS amount_crypto NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_fiat NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS escrow_status TEXT DEFAULT 'pending';

-- Add missing columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add missing columns to payment_methods
ALTER TABLE public.payment_methods
ADD COLUMN IF NOT EXISTS country CHARACTER VARYING DEFAULT 'NG';

-- Update existing functions to include new parameters
CREATE OR REPLACE FUNCTION public.get_credit_balance(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT credits_balance FROM public.profiles WHERE user_id = p_user_id),
    0
  );
END;
$$;