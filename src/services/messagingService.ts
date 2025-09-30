import { supabase } from '@/integrations/supabase/client';
import { notificationService } from './notificationService';

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
  message_type: 'text' | 'image' | 'file' | 'video';
  is_read: boolean;
  created_at: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
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

  // Upload file to Supabase storage
  async uploadFile(file: File): Promise<{ data: { url: string } | null; error: any }> {
    try {
      console.log('Starting file upload:', file.name, file.size);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = fileName; // Simplified path

      console.log('Uploading to path:', filePath);

      const { data, error } = await supabase.storage
        .from('message-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return { data: null, error };
      }

      console.log('Upload successful:', data);

      const { data: { publicUrl } } = supabase.storage
        .from('message-files')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      return { data: { url: publicUrl }, error: null };
    } catch (error) {
      console.error('Upload exception:', error);
      return { data: null, error };
    }
  }

  // Send a message
  async sendMessage(
    conversationId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' | 'video' = 'text',
    fileUrl?: string,
    fileName?: string,
    fileSize?: number,
    mimeType?: string
  ): Promise<{ data: Message | null; error: any }> {
    const timestamp = new Date().toISOString();
    console.log(`📤 [${timestamp}] Sending message:`);
    console.log(`   🗨️ Conversation: ${conversationId}`);
    console.log(`   💬 Content: ${content.substring(0, 50)}...`);
    console.log(`   📎 Type: ${messageType}`);
    
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        console.log(`   ❌ User not authenticated`);
        return { data: null, error: 'Not authenticated' };
      }

      console.log(`   👤 Sender: ${currentUser.data.user.id}`);

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUser.data.user.id,
          content,
          message_type: messageType,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          mime_type: mimeType
        })
        .select()
        .single();

      if (error) {
        console.log(`   ❌ Error sending message:`, error);
        return { data, error };
      }

      console.log(`   ✅ Message sent successfully: ${data.id}`);
      console.log(`   🕐 Created at: ${data.created_at}`);

      // No automatic notifications - only send when explicitly requested
      // Notifications are handled by the UI layer when needed

      return { data, error };
    } catch (error) {
      console.log(`   ❌ Exception sending message:`, error);
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
    const timestamp = new Date().toISOString();
    console.log(`📖 [${timestamp}] Marking messages as read for conversation: ${conversationId}`);
    
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        console.log(`   ❌ User not authenticated`);
        return { error: 'Not authenticated' };
      }

      console.log(`   👤 User: ${currentUser.data.user.id}`);

      const { data, error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUser.data.user.id)
        .select('id, is_read');

      if (error) {
        console.log(`   ❌ Error marking messages as read:`, error);
        return { error };
      }

      console.log(`   ✅ Marked ${data?.length || 0} messages as read`);
      return { error: null };
    } catch (error) {
      console.log(`   ❌ Exception marking messages as read:`, error);
      return { error };
    }
  }

  // Subscribe to new messages in a conversation
  subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
    const timestamp = new Date().toISOString();
    console.log(`📡 [${timestamp}] Setting up message subscription for conversation: ${conversationId}`);
    
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        const msgTimestamp = new Date().toISOString();
        console.log(`📨 [${msgTimestamp}] New message received via subscription:`);
        console.log(`   🆔 Message ID: ${payload.new.id}`);
        console.log(`   👤 Sender: ${payload.new.sender_id}`);
        console.log(`   💬 Content: ${payload.new.content?.substring(0, 50)}...`);
        console.log(`   🕐 Created: ${payload.new.created_at}`);
        console.log(`   📖 Read status: ${payload.new.is_read}`);
        console.log(`   🗨️ Conversation: ${payload.new.conversation_id}`);
        
        callback(payload.new as Message);
      })
      .subscribe((status) => {
        console.log(`📡 [${timestamp}] Message subscription status for ${conversationId}:`, status);
      });
    
    return channel;
  }

  // Subscribe to conversation updates
  subscribeToConversations(userId: string, callback: () => void) {
    const timestamp = new Date().toISOString();
    console.log(`📡 [${timestamp}] Setting up conversation subscriptions for user: ${userId}`);
    
    const conversationChannel = supabase
      .channel(`conversations:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `or(participant_1_id.eq.${userId},participant_2_id.eq.${userId})`
      }, (payload) => {
        console.log(`🗨️ [${new Date().toISOString()}] Conversation update for user ${userId}:`, payload.eventType);
        callback();
      })
      .subscribe();
    
    // Also subscribe to new messages to update conversation list
    const messageChannel = supabase
      .channel(`messages:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, async (payload) => {
        const msgTimestamp = new Date().toISOString();
        console.log(`📨 [${msgTimestamp}] New message detected for user ${userId}:`);
        console.log(`   🆔 Message ID: ${payload.new.id}`);
        console.log(`   👤 Sender: ${payload.new.sender_id}`);
        console.log(`   🗨️ Conversation: ${payload.new.conversation_id}`);
        
        // Check if this message belongs to user's conversation
        const { data: conversation } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', payload.new.conversation_id)
          .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
          .single();
        
        if (conversation) {
          console.log(`   ✅ Message belongs to user ${userId}'s conversation`);
          callback();
        } else {
          console.log(`   ❌ Message does not belong to user ${userId}'s conversation`);
        }
      })
      .subscribe();
    
    return {
      unsubscribe: () => {
        console.log(`📡 [${new Date().toISOString()}] Unsubscribing conversation channels for user: ${userId}`);
        conversationChannel.unsubscribe();
        messageChannel.unsubscribe();
      }
    };
  }
}

export const messagingService = new MessagingService();