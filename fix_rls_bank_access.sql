-- Temporarily disable RLS on user_bank_accounts to fix access issue
ALTER TABLE user_bank_accounts DISABLE ROW LEVEL SECURITY;

-- Or create a more permissive policy for authenticated users
DROP POLICY IF EXISTS "Users can manage their own bank accounts" ON user_bank_accounts;
DROP POLICY IF EXISTS "Merchants can view bank accounts for accepted trades" ON user_bank_accounts;

-- Create a simple policy that allows authenticated users to read bank accounts
CREATE POLICY "Allow authenticated users to read bank accounts" ON user_bank_accounts
FOR SELECT USING (auth.role() = 'authenticated');

-- Re-enable RLS
ALTER TABLE user_bank_accounts ENABLE ROW LEVEL SECURITY;