-- Update vendors table with area_type and bank details
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS area_type VARCHAR(20) DEFAULT 'mainland';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS account_number VARCHAR(20);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS account_name VARCHAR(255);

-- Update existing vendors with area_type
UPDATE vendors SET area_type = 'mainland' WHERE location IN ('Ikeja', 'Yaba', 'Airport Road');
UPDATE vendors SET area_type = 'island' WHERE location IN ('Lagos Island', 'Lekki', 'Ajah');

-- Add sample bank details for vendors
UPDATE vendors SET 
  bank_name = 'First Bank Nigeria',
  account_number = '2011234567',
  account_name = 'TradeHub Ikeja Ltd'
WHERE location = 'Ikeja';

UPDATE vendors SET 
  bank_name = 'GTBank',
  account_number = '0123456789',
  account_name = 'TradeHub Yaba Ltd'
WHERE location = 'Yaba';

UPDATE vendors SET 
  bank_name = 'Access Bank',
  account_number = '0987654321',
  account_name = 'TradeHub Airport Ltd'
WHERE location = 'Airport Road';

UPDATE vendors SET 
  bank_name = 'UBA',
  account_number = '1234567890',
  account_name = 'TradeHub Island Ltd'
WHERE location = 'Lagos Island';

UPDATE vendors SET 
  bank_name = 'Zenith Bank',
  account_number = '5678901234',
  account_name = 'TradeHub Lekki Ltd'
WHERE location = 'Lekki';

UPDATE vendors SET 
  bank_name = 'Sterling Bank',
  account_number = '9876543210',
  account_name = 'TradeHub Ajah Ltd'
WHERE location = 'Ajah';