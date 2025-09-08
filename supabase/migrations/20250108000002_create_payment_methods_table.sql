-- Create payment_methods table for storing bank account details

-- Drop the existing table if it exists
DROP TABLE IF EXISTS public.payment_methods CASCADE;

-- Create the payment_methods table
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Bank account details
  account_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  bank_code TEXT,
  
  -- Payment method type
  method_type TEXT NOT NULL DEFAULT 'bank_transfer' CHECK (method_type IN ('bank_transfer', 'cash', 'mobile_money')),
  
  -- Status
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX idx_payment_methods_is_default ON public.payment_methods(is_default);
CREATE INDEX idx_payment_methods_is_active ON public.payment_methods(is_active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_methods_updated_at();

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can view their own payment methods" ON public.payment_methods
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can insert their own payment methods" ON public.payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can update their own payment methods" ON public.payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own payment methods" ON public.payment_methods;
CREATE POLICY "Users can delete their own payment methods" ON public.payment_methods
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;
