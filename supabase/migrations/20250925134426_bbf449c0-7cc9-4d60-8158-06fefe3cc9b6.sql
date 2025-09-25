-- Add missing column to trades table for broadcast tracking
ALTER TABLE trades ADD COLUMN IF NOT EXISTS broadcasted_at TIMESTAMP WITH TIME ZONE;