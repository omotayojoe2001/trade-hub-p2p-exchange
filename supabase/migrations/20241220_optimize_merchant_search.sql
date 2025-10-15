-- Optimize merchant search performance with indexes
-- Add composite indexes for common merchant search queries

-- Index for merchant search with online status and rating
CREATE INDEX IF NOT EXISTS idx_profiles_merchant_search 
ON profiles (is_merchant, is_active, is_online, rating DESC) 
WHERE is_merchant = true AND is_active = true;

-- Index for merchant search excluding vendors
CREATE INDEX IF NOT EXISTS idx_profiles_merchant_no_vendor 
ON profiles (is_merchant, is_active, role, is_online, rating DESC) 
WHERE is_merchant = true AND is_active = true AND role != 'vendor';

-- Index for supported_cryptos array searches
CREATE INDEX IF NOT EXISTS idx_profiles_supported_cryptos 
ON profiles USING GIN (supported_cryptos) 
WHERE is_merchant = true AND is_active = true;

-- Index for payment_methods array searches
CREATE INDEX IF NOT EXISTS idx_profiles_payment_methods 
ON profiles USING GIN (payment_methods) 
WHERE is_merchant = true AND is_active = true;

-- Index for location searches
CREATE INDEX IF NOT EXISTS idx_profiles_location 
ON profiles (location) 
WHERE is_merchant = true AND is_active = true AND location IS NOT NULL;

-- Index for response time ordering
CREATE INDEX IF NOT EXISTS idx_profiles_response_time 
ON profiles (is_merchant, is_active, response_time_minutes) 
WHERE is_merchant = true AND is_active = true;

-- Analyze tables to update statistics
ANALYZE profiles;