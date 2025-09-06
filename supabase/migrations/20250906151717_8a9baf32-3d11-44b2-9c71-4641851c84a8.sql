-- Fix critical RLS policies and database issues

-- 1. Fix trade_requests RLS policies to allow merchant acceptance
DROP POLICY IF EXISTS "trade_requests_update_policy" ON public.trade_requests;

CREATE POLICY "trade_requests_update_policy" ON public.trade_requests
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (status = 'open' AND expires_at > now())
    );

-- 2. Fix trades table RLS to allow escrow creation by merchants
DROP POLICY IF EXISTS "Users can create trades" ON public.trades;
DROP POLICY IF EXISTS "Users can update their own trades" ON public.trades;

CREATE POLICY "Users can create trades" ON public.trades
    FOR INSERT WITH CHECK (
        auth.uid() = buyer_id OR 
        auth.uid() = seller_id OR
        EXISTS (
            SELECT 1 FROM trade_requests 
            WHERE id = trade_request_id 
            AND (user_id = auth.uid() OR status = 'open')
        )
    );

CREATE POLICY "Users can update their own trades" ON public.trades
    FOR UPDATE USING (
        auth.uid() = buyer_id OR 
        auth.uid() = seller_id
    );

-- 3. Fix profiles visibility for merchant discovery
DROP POLICY IF EXISTS "view_active_merchants_only" ON public.profiles;

CREATE POLICY "view_active_merchants_only" ON public.profiles
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (is_merchant = true AND merchant_mode = true AND is_active = true)
    );

-- 4. Add sell crypto flow status to trades table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'crypto_deposited_at') THEN
        ALTER TABLE public.trades ADD COLUMN crypto_deposited_at timestamp with time zone;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'cash_payment_confirmed_at') THEN
        ALTER TABLE public.trades ADD COLUMN cash_payment_confirmed_at timestamp with time zone;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'crypto_released_at') THEN
        ALTER TABLE public.trades ADD COLUMN crypto_released_at timestamp with time zone;
    END IF;
END $$;

-- 5. Update the notify_trade_accepted trigger to be more robust
CREATE OR REPLACE FUNCTION public.notify_trade_accepted()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    request_record RECORD;
BEGIN
    -- Only notify if trade_request_id exists
    IF NEW.trade_request_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get the trade request details
    SELECT * INTO request_record
    FROM public.trade_requests
    WHERE id = NEW.trade_request_id;

    IF FOUND THEN
        -- Notify the original requester
        BEGIN
            INSERT INTO public.notifications (user_id, type, title, message, read, data)
            VALUES (
                request_record.user_id,
                'trade_update',
                'Trade Request Accepted!',
                'Your ' || COALESCE(request_record.trade_type, 'trade') || ' request for ' || COALESCE(request_record.amount_crypto::text, '0') || ' ' || COALESCE(request_record.crypto_type, 'crypto') || ' has been accepted.',
                false,
                jsonb_build_object(
                    'trade_id', NEW.id,
                    'trade_request_id', NEW.trade_request_id,
                    'status', NEW.status
                )
            );
        EXCEPTION WHEN OTHERS THEN
            -- Log error but don't fail the transaction
            RAISE NOTICE 'Failed to create notification for requester: %', SQLERRM;
        END;

        -- Notify the accepter
        BEGIN
            INSERT INTO public.notifications (user_id, type, title, message, read, data)
            VALUES (
                CASE
                    WHEN NEW.buyer_id = request_record.user_id THEN NEW.seller_id
                    ELSE NEW.buyer_id
                END,
                'trade_update',
                'Trade Started!',
                'You have accepted a ' || COALESCE(request_record.trade_type, 'trade') || ' request for ' || COALESCE(request_record.amount_crypto::text, '0') || ' ' || COALESCE(request_record.crypto_type, 'crypto') || '.',
                false,
                jsonb_build_object(
                    'trade_id', NEW.id,
                    'trade_request_id', NEW.trade_request_id,
                    'status', NEW.status
                )
            );
        EXCEPTION WHEN OTHERS THEN
            -- Log error but don't fail the transaction
            RAISE NOTICE 'Failed to create notification for accepter: %', SQLERRM;
        END;
    END IF;

    RETURN NEW;
END;
$function$;

-- 6. Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS notify_trade_accepted_trigger ON public.trades;
CREATE TRIGGER notify_trade_accepted_trigger
    AFTER INSERT ON public.trades
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_trade_accepted();