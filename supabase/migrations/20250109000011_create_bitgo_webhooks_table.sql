-- Create table for BitGo webhook logs
CREATE TABLE IF NOT EXISTS public.bitgo_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_data JSONB NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for querying
CREATE INDEX IF NOT EXISTS idx_bitgo_webhooks_received_at ON public.bitgo_webhooks(received_at);

-- Enable RLS
ALTER TABLE public.bitgo_webhooks ENABLE ROW LEVEL SECURITY;

-- Create policy for system access
CREATE POLICY "System can manage webhooks" ON public.bitgo_webhooks FOR ALL USING (true);