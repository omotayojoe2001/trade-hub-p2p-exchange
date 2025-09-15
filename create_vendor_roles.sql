-- Create vendor roles and permissions

-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'merchant', 'vendor', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policies for user_roles
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage roles" ON user_roles
  FOR ALL USING (true);

-- Add indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- Function to check if user has role
CREATE OR REPLACE FUNCTION has_role(user_uuid UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid AND role = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign vendor role
CREATE OR REPLACE FUNCTION assign_vendor_role(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_roles (user_id, role) 
  VALUES (user_uuid, 'vendor')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Also update profiles table
  UPDATE profiles 
  SET user_type = 'vendor', is_vendor = true 
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;