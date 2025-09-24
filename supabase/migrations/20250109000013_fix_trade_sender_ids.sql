-- Fix trade sender IDs and ensure they are set correctly

-- Function to set crypto and cash sender IDs based on trade type
CREATE OR REPLACE FUNCTION set_trade_sender_ids()
RETURNS TRIGGER AS $$
BEGIN
    -- For buy crypto trades: buyer sends cash, seller sends crypto
    -- For sell crypto trades: seller sends crypto, buyer sends cash
    
    IF NEW.trade_type = 'buy' THEN
        NEW.crypto_sender_id = NEW.seller_id;  -- Seller sends crypto
        NEW.cash_sender_id = NEW.buyer_id;     -- Buyer sends cash
    ELSIF NEW.trade_type = 'sell' THEN
        NEW.crypto_sender_id = NEW.buyer_id;   -- Buyer sends crypto (in sell context, buyer is the one selling)
        NEW.cash_sender_id = NEW.seller_id;    -- Seller sends cash (merchant buying crypto)
    END IF;
    
    -- Set escrow expiry to 30 minutes from now if not set
    IF NEW.escrow_expires_at IS NULL THEN
        NEW.escrow_expires_at = NOW() + INTERVAL '30 minutes';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set sender IDs
DROP TRIGGER IF EXISTS tr_set_trade_sender_ids ON trades;
CREATE TRIGGER tr_set_trade_sender_ids
    BEFORE INSERT OR UPDATE ON trades
    FOR EACH ROW
    EXECUTE FUNCTION set_trade_sender_ids();

-- Update existing trades to set sender IDs correctly
UPDATE trades 
SET 
    crypto_sender_id = CASE 
        WHEN trade_type = 'buy' THEN seller_id 
        WHEN trade_type = 'sell' THEN buyer_id 
        ELSE crypto_sender_id 
    END,
    cash_sender_id = CASE 
        WHEN trade_type = 'buy' THEN buyer_id 
        WHEN trade_type = 'sell' THEN seller_id 
        ELSE cash_sender_id 
    END,
    escrow_expires_at = CASE 
        WHEN escrow_expires_at IS NULL THEN created_at + INTERVAL '30 minutes'
        ELSE escrow_expires_at 
    END
WHERE crypto_sender_id IS NULL OR cash_sender_id IS NULL OR escrow_expires_at IS NULL;