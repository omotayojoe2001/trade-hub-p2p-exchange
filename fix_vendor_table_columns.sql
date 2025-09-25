-- Add missing columns to vendors table for profile updates

-- Add missing columns to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS account_name TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS address TEXT;

-- Update existing vendors with all details from vendor_profiles
UPDATE vendors 
SET 
    display_name = vp.display_name,
    bank_name = vp.bank_name,
    bank_account = vp.account_number,
    account_name = vp.account_name,
    address = vp.address,
    phone_number = vp.phone_number,
    location = vp.location
FROM vendor_profiles vp 
WHERE vendors.email = vp.email;

-- Show updated vendors table structure
SELECT 
    email, 
    name,
    display_name, 
    location, 
    phone_number, 
    bank_name, 
    bank_account, 
    account_name,
    address
FROM vendors;