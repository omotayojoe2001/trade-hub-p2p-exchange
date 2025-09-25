-- Add 500 credits to joshuatimilehin1010@gmail.com for testing
UPDATE profiles 
SET credits_balance = COALESCE(credits_balance, 0) + 500
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'joshuatimilehin1010@gmail.com'
);

-- Record the credit grant transaction
INSERT INTO credit_purchase_transactions (
  user_id,
  credits_amount,
  price_paid_naira,
  status,
  payment_reference,
  created_at
)
SELECT 
  id,
  500,
  0,
  'paid',
  'FREE_TESTING_CREDITS_' || extract(epoch from now()),
  now()
FROM auth.users 
WHERE email = 'joshuatimilehin1010@gmail.com';