import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Type definitions
type Tables = Database['public']['Tables'];
type TradeRequest = Tables['trade_requests']['Row'];
type Trade = Tables['trades']['Row'];
type Notification = Tables['notifications']['Row'];
type Message = Tables['messages']['Row'];
type Receipt = Tables['receipts']['Row'];
type BlogPost = Tables['blog_posts']['Row'];

// User Profile Service
export const userService = {
  // Get current user profile
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update user profile
  async updateProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create user profile
  async createProfile(profile: any) {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Trade Requests Service
export const tradeRequestService = {
  // Get all trade requests
  async getTradeRequests() {
    const { data, error } = await supabase
      .from('trade_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get trade requests by user
  async getTradeRequestsByUser(userId: string) {
    const { data, error } = await supabase
      .from('trade_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Create trade request
  async createTradeRequest(tradeRequest: Omit<TradeRequest, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('trade_requests')
      .insert(tradeRequest)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update trade request
  async updateTradeRequest(id: string, updates: Partial<TradeRequest>) {
    const { data, error } = await supabase
      .from('trade_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete trade request
  async deleteTradeRequest(id: string) {
    const { error } = await supabase
      .from('trade_requests')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Trades Service
export const tradeService = {
  // Get all trades
  async getTrades() {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get trades by user
  async getTradesByUser(userId: string) {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get trade by ID
  async getTradeById(id: string) {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create trade
  async createTrade(trade: Omit<Trade, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('trades')
      .insert(trade)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update trade
  async updateTrade(id: string, updates: Partial<Trade>) {
    const { data, error } = await supabase
      .from('trades')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Notifications Service
export const notificationService = {
  // Get notifications by user
  async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get unread notifications count
  async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);
    
    if (error) throw error;
    return count || 0;
  },

  // Create notification
  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Mark notification as read
  async markAsRead(id: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Mark all notifications as read
  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    
    if (error) throw error;
  }
};

// Messages Service
export const messageService = {
  // Get messages by trade
  async getMessagesByTrade(tradeId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('trade_id', tradeId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Send message
  async sendMessage(message: Omit<Message, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Mark messages as read
  async markMessagesAsRead(tradeId: string, userId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('trade_id', tradeId)
      .neq('sender_id', userId)
      .eq('read', false);
    
    if (error) throw error;
  }
};

// Receipts Service
export const receiptService = {
  // Get receipts by trade
  async getReceiptsByTrade(tradeId: string) {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('trade_id', tradeId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Create receipt
  async createReceipt(receipt: Omit<Receipt, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('receipts')
      .insert(receipt)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Blog Service
export const blogService = {
  // Get all published blog posts
  async getPublishedPosts() {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get blog post by ID
  async getPostById(id: string) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .eq('published', true)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create blog post (admin only)
  async createPost(post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert(post)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update blog post (admin only)
  async updatePost(id: string, updates: Partial<BlogPost>) {
    const { data, error } = await supabase
      .from('blog_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// File Storage Service
export const storageService = {
  // Upload file to Supabase Storage
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    
    if (error) throw error;
    return data;
  },

  // Get public URL for file
  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  },

  // Delete file from storage
  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) throw error;
  }
};

// Real-time subscriptions
export const realtimeService = {
  // Subscribe to trade updates
  subscribeToTrade(tradeId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`trade:${tradeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trades',
        filter: `id=eq.${tradeId}`
      }, callback)
      .subscribe();
  },

  // Subscribe to user notifications
  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe();
  },

  // Subscribe to trade messages
  subscribeToMessages(tradeId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`messages:${tradeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `trade_id=eq.${tradeId}`
      }, callback)
      .subscribe();
  }
};

// Export all services
export default {
  userService,
  tradeRequestService,
  tradeService,
  notificationService,
  messageService,
  receiptService,
  blogService,
  storageService,
  realtimeService
};
