-- Fix the notify_trade_accepted function to use trade_type instead of direction
CREATE OR REPLACE FUNCTION public.notify_trade_accepted()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    request_record RECORD;
BEGIN
    -- Get the trade request details
    SELECT * INTO request_record
    FROM public.trade_requests
    WHERE id = NEW.trade_request_id;

    IF FOUND THEN
        -- Notify the original requester
        INSERT INTO public.notifications (user_id, type, title, message, read, data)
        VALUES (
            request_record.user_id,
            'trade_update',
            'Trade Request Accepted!',
            'Your ' || request_record.trade_type || ' request for ' || request_record.amount_crypto || ' ' || request_record.crypto_type || ' has been accepted.',
            false,
            jsonb_build_object(
                'trade_id', NEW.id,
                'trade_request_id', NEW.trade_request_id,
                'status', NEW.status
            )
        );

        -- Notify the accepter
        INSERT INTO public.notifications (user_id, type, title, message, read, data)
        VALUES (
            CASE
                WHEN NEW.buyer_id = request_record.user_id THEN NEW.seller_id
                ELSE NEW.buyer_id
            END,
            'trade_update',
            'Trade Started!',
            'You have accepted a ' || request_record.trade_type || ' request for ' || request_record.amount_crypto || ' ' || request_record.crypto_type || '.',
            false,
            jsonb_build_object(
                'trade_id', NEW.id,
                'trade_request_id', NEW.trade_request_id,
                'status', NEW.status
            )
        );
    END IF;

    RETURN NEW;
END;
$function$;