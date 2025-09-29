import { supabase } from '@/integrations/supabase/client';

export interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  trade_id?: string;
  cash_trade_id?: string;
  trade_request_id?: string;
  context_type: 'crypto_trade' | 'cash_delivery' | 'trade_request';
  last_message_at: string;
  created_at: string;
  other_user?: {
    display_name: string;
    avatar_url?: string;
  };
  last_message?: {
    content: string;
    sender_id: string;
    created_at: string;
  };
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file';
  is_read: boolean;
  created_at: string;
}

class MessagingService {
  // Get or create conversation between two users for a specific trade
  async getOrCreateConversation(
    otherUserId: string,
    tradeId?: string,
    cashTradeId?: string,
    tradeRequestId?: string,
    contextType: 'crypto_trade' | 'cash_delivery' | 'trade_request' = 'crypto_trade'
  ): Promise<{ data: Conversation | null; error: any }> {
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        return { data: null, error: 'Not authenticated' };
      }

      const userId = currentUser.data.user.id;

      // Try to find existing conversation
      let query = supabase
        .from('conversations')
        .select('*')
        .or(`and(participant_1_id.eq.${userId},participant_2_id.eq.${otherUserId}),and(participant_1_id.eq.${otherUserId},participant_2_id.eq.${userId})`);

      if (tradeId) query = query.eq('trade_id', tradeId);
      if (cashTradeId) query = query.eq('cash_trade_id', cashTradeId);
      if (tradeRequestId) query = query.eq('trade_request_id', tradeRequestId);

      const { data: existing } = await query.maybeSingle();

      if (existing) {
        return { data: existing, error: null };
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          participant_1_id: userId,
          participant_2_id: otherUserId,
          trade_id: tradeId,
          cash_trade_id: cashTradeId,
          trade_request_id: tradeRequestId,
          context_type: contextType
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Send a message
  async sendMessage(
    conversationId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text'
  ): Promise<{ data: Message | null; error: any }> {
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        return { data: null, error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUser.data.user.id,
          content,
          message_type: messageType
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId: string): Promise<{ data: Message[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Get all conversations for current user with user details
  async getConversations(): Promise<{ data: Conversation[] | null; error: any }> {
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        return { data: null, error: 'Not authenticated' };
      }

      const userId = currentUser.data.user.id;

      // Get unique conversations (group by participants to avoid duplicates)
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) return { data: null, error };

      // Group conversations by unique participant pairs to eliminate duplicates
      const uniqueConversations = new Map<string, any>();
      
      (conversations || []).forEach(conv => {
        const otherUserId = conv.participant_1_id === userId ? conv.participant_2_id : conv.participant_1_id;
        const key = [userId, otherUserId].sort().join('-');
        
        // Keep the most recent conversation for each unique pair
        if (!uniqueConversations.has(key) || 
            new Date(conv.last_message_at) > new Date(uniqueConversations.get(key).last_message_at)) {
          uniqueConversations.set(key, conv);
        }
      });

      // Enhance conversations with user details and message info
      const enhancedConversations = await Promise.all(
        Array.from(uniqueConversations.values()).map(async (conv) => {
          const otherUserId = conv.participant_1_id === userId ? conv.participant_2_id : conv.participant_1_id;
          
          // Get other user's name
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', otherUserId)
            .single();

          // Get latest message for this conversation
          const { data: latestMessage } = await supabase
            .from('messages')
            .select('content, sender_id, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Count unread messages
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', userId);

          return {
            ...conv,
            other_user: {
              display_name: profile?.display_name || `User ${otherUserId.slice(-4)}`,
              avatar_url: null
            },
            last_message: latestMessage || null,
            unread_count: unreadCount || 0
          };
        })
      );

      return { data: enhancedConversations, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string): Promise<{ error: any }> {
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        return { error: 'Not authenticated' };
      }

      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUser.data.user.id);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  // Subscribe to new messages in a conversation
  subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        console.log('📨 New message received:', payload.new);
        callback(payload.new as Message);
      })
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });
    
    return channel;
  }

  // Subscribe to conversation updates
  subscribeToConversations(userId: string, callback: (conversation: Conversation) => void) {
    return supabase
      .channel(`conversations:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `or(participant_1_id.eq.${userId},participant_2_id.eq.${userId})`
      }, (payload) => {
        callback(payload.new as Conversation);
      })
      .subscribe();
  }
}

export const messagingService = new MessagingService();