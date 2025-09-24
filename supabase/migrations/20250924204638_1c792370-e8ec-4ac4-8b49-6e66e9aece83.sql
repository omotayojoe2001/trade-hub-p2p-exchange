-- Add country and state fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS country VARCHAR(3) DEFAULT 'NG',
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Update existing records to have Nigeria as default country
UPDATE profiles SET country = 'NG' WHERE country IS NULL;