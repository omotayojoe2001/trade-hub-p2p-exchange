-- FIX CASH TRADES RLS POLICY
-- Run this in Supabase SQL Editor

-- Drop existing RLS policies that might be too restrictive
DROP POLICY IF EXISTS "Users can view their own cash trades" ON cash_trades;
DROP POLICY IF EXISTS "Users can insert their own cash trades" ON cash_trades;
DROP POLICY IF EXISTS "Users can update their own cash trades" ON cash_trades;

-- Create more permissive RLS policies for cash_trades
CREATE POLICY "Allow authenticated users to view cash trades" ON cash_trades
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert cash trades" ON cash_trades
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update cash trades" ON cash_trades
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Also ensure vendors can access their assigned trades
CREATE POLICY "Vendors can access their assigned trades" ON cash_trades
    FOR ALL USING (
        vendor_id IN (
            SELECT id FROM vendors WHERE user_id = auth.uid()
        )
    );

-- Merchants can access trades they're involved in
CREATE POLICY "Merchants can access their trades" ON cash_trades
    FOR ALL USING (buyer_id = auth.uid());

-- Sellers can access their trades
CREATE POLICY "Sellers can access their trades" ON cash_trades
    FOR ALL USING (seller_id = auth.uid());

SELECT 'Cash trades RLS policies updated!' as status;