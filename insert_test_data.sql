-- Insert test address using first available user
INSERT INTO user_addresses (user_id, street, city, state, landmark, label) 
SELECT 
  id,
  '123 Test Street', 
  'Lagos', 
  'Lagos State', 
  'Near Test Mall', 
  'Home Address'
FROM auth.users 
LIMIT 1;

-- Insert test contact using first available user
INSERT INTO user_contacts (user_id, phone_number, whatsapp_number, label) 
SELECT 
  id,
  '+234 802 123 4567', 
  '+234 802 123 4567', 
  'Personal Contact'
FROM auth.users 
LIMIT 1;