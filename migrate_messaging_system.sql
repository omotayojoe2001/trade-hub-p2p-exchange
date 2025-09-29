-- Migration script to preserve existing messages while fixing duplicates

-- Create new tables if they don't exist (without dropping)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id UUID NOT NULL,
  participant_2_id UUID NOT NULL,
  trade_id UUID,
  cash_trade_id UUID,
  trade_request_id UUID,
  context_type TEXT CHECK (context_type IN ('crypto_trade', 'cash_delivery', 'trade_request')) NOT NULL,
  last_message_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Remove duplicate conversations (keep the most recent one for each participant pair)
WITH ranked_conversations AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY 
        LEAST(participant_1_id, participant_2_id), 
        GREATEST(participant_1_id, participant_2_id),
        COALESCE(trade_id::text, cash_trade_id::text, trade_request_id::text, 'general')
      ORDER BY last_message_at DESC
    ) as rn
  FROM conversations
)
DELETE FROM conversations 
WHERE id IN (
  SELECT id FROM ranked_conversations WHERE rn > 1
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_trade_id ON conversations(trade_id);
CREATE INDEX IF NOT EXISTS idx_conversations_cash_trade_id ON conversations(cash_trade_id);
CREATE INDEX IF NOT EXISTS idx_conversations_trade_request_id ON conversations(trade_request_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Add unique constraints (will fail if duplicates exist, but we cleaned them above)
DROP INDEX IF EXISTS idx_conversations_unique_trade;
DROP INDEX IF EXISTS idx_conversations_unique_cash_trade;
DROP INDEX IF EXISTS idx_conversations_unique_trade_request;

CREATE UNIQUE INDEX idx_conversations_unique_trade 
  ON conversations(LEAST(participant_1_id, participant_2_id), GREATEST(participant_1_id, participant_2_id), trade_id) 
  WHERE trade_id IS NOT NULL;

CREATE UNIQUE INDEX idx_conversations_unique_cash_trade 
  ON conversations(LEAST(participant_1_id, participant_2_id), GREATEST(participant_1_id, participant_2_id), cash_trade_id) 
  WHERE cash_trade_id IS NOT NULL;

CREATE UNIQUE INDEX idx_conversations_unique_trade_request 
  ON conversations(LEAST(participant_1_id, participant_2_id), GREATEST(participant_1_id, participant_2_id), trade_request_id) 
  WHERE trade_request_id IS NOT NULL;

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update message read status" ON messages;

-- Create RLS policies
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (
    auth.uid() = participant_1_id OR 
    auth.uid() = participant_2_id
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = participant_1_id OR 
    auth.uid() = participant_2_id
  );

CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.participant_1_id = auth.uid() OR conversations.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.participant_1_id = auth.uid() OR conversations.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update message read status" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.participant_1_id = auth.uid() OR conversations.participant_2_id = auth.uid())
    )
  );

-- Create trigger function
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET last_message_at = NEW.created_at 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();