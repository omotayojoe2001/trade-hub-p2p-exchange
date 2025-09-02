import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  trade_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  media_url?: string;
  read: boolean;
  created_at: string;
}

export const useRealTimeMessaging = (tradeId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load existing messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!user || !tradeId) return;

      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('trade_id', tradeId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        setMessages((data || []) as Message[]);
        
        // Count unread messages
        const unread = data?.filter(msg => 
          msg.receiver_id === user.id && !msg.read
        ).length || 0;
        setUnreadCount(unread);

      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [user, tradeId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!tradeId) return;

    const channel = supabase
      .channel(`messages:${tradeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `trade_id=eq.${tradeId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          
          // If it's not from current user, show notification and increment unread
          if (newMessage.sender_id !== user?.id) {
            setUnreadCount(prev => prev + 1);
            toast({
              title: 'New Message',
              description: newMessage.content.length > 50 
                ? newMessage.content.substring(0, 50) + '...'
                : newMessage.content,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `trade_id=eq.${tradeId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tradeId, user, toast]);

  // Send message
  const sendMessage = useCallback(async (content: string, receiverId: string, messageType: 'text' | 'image' | 'file' = 'text', mediaUrl?: string) => {
    if (!user || !tradeId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          trade_id: tradeId,
          sender_id: user.id,
          receiver_id: receiverId,
          content,
          message_type: messageType,
          media_url: mediaUrl,
          read: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  }, [user, tradeId, toast]);

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!user || !tradeId) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('trade_id', tradeId)
        .eq('receiver_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setUnreadCount(0);
      setMessages(prev => 
        prev.map(msg => 
          msg.receiver_id === user.id ? { ...msg, read: true } : msg
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user, tradeId]);

  // Upload media file
  const uploadMedia = useCallback(async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('chat-media')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading media:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload media',
        variant: 'destructive'
      });
      return null;
    }
  }, [user, toast]);

  return {
    messages,
    isLoading,
    unreadCount,
    sendMessage,
    markAsRead,
    uploadMedia
  };
};