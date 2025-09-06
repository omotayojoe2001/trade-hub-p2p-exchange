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
    const { data, error } = await (supabase as any)
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
export const notificationService: any = {
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

// Real-time Trade Request Service
export const realTimeTradeRequestService = {
  // Create real trade request
  async createTradeRequest(request: {
    trade_type: 'buy' | 'sell';
    coin_type: string;
    amount: number;
    naira_amount: number;
    rate: number;
    payment_method?: string;
    bank_account_details?: any;
    notes?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('trade_requests')
      .insert({
        user_id: user.id,
        trade_type: request.trade_type,
        crypto_type: request.coin_type,
        amount_crypto: request.amount,
        amount_fiat: request.naira_amount,
        rate: request.rate,
        payment_method: request.payment_method,
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
        status: 'open'
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification for other users
    await notificationService.createNotification({
      user_id: user.id,
      type: 'trade_request',
      title: `New ${request.trade_type} request`,
      message: `${request.amount} ${request.coin_type} for ₦${request.naira_amount.toLocaleString()}`,
      read: false,
      data: { trade_request_id: data.id }
    });

    return data;
  },

  // Accept trade request
  async acceptTradeRequest(requestId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Update trade request
    const { data: request, error: requestError } = await supabase
      .from('trade_requests')
      .update({
        status: 'matched',
        matched_user_id: user.id
      })
      .eq('id', requestId)
      .select()
      .single();

    if (requestError) throw requestError;

    // Create actual trade
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .insert({
        trade_request_id: requestId,
        buyer_id: request.trade_type === 'sell' ? user.id : request.user_id,
        seller_id: request.trade_type === 'sell' ? request.user_id : user.id,
        coin_type: request.crypto_type,
        amount: request.amount_crypto,
        rate: request.rate,
        naira_amount: request.amount_fiat,
        trade_type: request.trade_type,
        payment_method: request.payment_method || 'bank_transfer',
        bank_account_details: null,
        status: 'pending'
      })
      .select()
      .single();

    if (tradeError) throw tradeError;

    // Notify original requester
    await notificationService.createNotification({
      user_id: request.user_id,
      type: 'trade_update',
      title: 'Trade Request Accepted!',
      message: `Your ${request.trade_type} request has been accepted`,
      read: false,
      data: { trade_id: trade.id, trade_request_id: requestId }
    });

    return { trade, request };
  },

  // Get all open trade requests (excluding user's own)
  async getOpenTradeRequests() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('trade_requests')
      .select(`
        *,
        user_profiles!trade_requests_user_id_fkey (
          full_name,
          rating,
          trade_count,
          verification_level
        )
      `)
      .eq('status', 'open')
      .neq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get user's own trade requests
  async getUserTradeRequests() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('trade_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};

// Simplified Delivery Tracking Service (using existing tables)
export const deliveryTrackingService = {
  // Create delivery tracking using tracking_codes table
  async createDeliveryTracking(data: {
    trade_id: string;
    delivery_type: 'cash_delivery' | 'cash_pickup';
    amount: number;
    currency: string;
    crypto_type: string;
    crypto_amount: number;
    pickup_location?: string;
    delivery_address?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Generate tracking code
    const trackingCode = `${data.delivery_type === 'cash_delivery' ? 'TD' : 'TP'}-${new Date().getFullYear()}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;

    // Create tracking record using existing tracking_codes table
    const { data: tracking, error } = await supabase
      .from('tracking_codes')
      .insert({
        user_id: user.id,
        tracking_code: trackingCode,
        trade_id: data.trade_id,
        status: 'active',
        metadata: {
          delivery_type: data.delivery_type,
          amount: data.amount,
          currency: data.currency,
          crypto_type: data.crypto_type,
          crypto_amount: data.crypto_amount,
          pickup_location: data.pickup_location,
          delivery_address: data.delivery_address,
          agent_name: 'Michael Johnson',
          agent_phone: '+234 801 234 5678',
          current_location: 'Processing',
          timeline: [
            { step: 'Order Received', time: new Date().toISOString(), completed: true },
            { step: 'Agent Assigned', time: new Date().toISOString(), completed: true },
            { step: data.delivery_type === 'cash_delivery' ? 'Cash Prepared' : 'Pickup Ready', time: null, completed: false },
            { step: data.delivery_type === 'cash_delivery' ? 'Out for Delivery' : 'Ready for Collection', time: null, completed: false },
            { step: data.delivery_type === 'cash_delivery' ? 'Delivered' : 'Collected', time: null, completed: false }
          ]
        }
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification
    await notificationService.createNotification({
      user_id: user.id,
      type: 'trade_update',
      title: 'Delivery Tracking Created',
      message: `Your ${data.delivery_type.replace('_', ' ')} is being processed. Tracking code: ${trackingCode}`,
      read: false,
      data: { tracking_code: trackingCode, delivery_tracking_id: tracking.id }
    });

    return {
      tracking_code: trackingCode,
      ...tracking
    };
  },

  // Get tracking by code
  async getTrackingByCode(trackingCode: string) {
    const { data, error } = await supabase
      .from('tracking_codes')
      .select('*')
      .eq('tracking_code', trackingCode)
      .single();

    if (error) {
      throw error;
    }

    // Transform data for display
    const metadata = data.metadata as any;
    return {
      tracking_code: data.tracking_code,
      delivery_type: metadata?.delivery_type || 'cash_delivery',
      status: data.status,
      agent_name: metadata?.agent_name || 'Agent Pending',
      agent_phone: metadata?.agent_phone || 'N/A',
      current_location: metadata?.current_location || 'Processing',
      amount: metadata?.amount || 0,
      currency: metadata?.currency || 'NGN',
      crypto_type: metadata?.crypto_type || 'BTC',
      crypto_amount: metadata?.crypto_amount || 0,
      timeline: metadata?.timeline || []
    };
  },

  // Get user's active tracking codes
  async getUserActiveTracking() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('tracking_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
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
  realtimeService,
  realTimeTradeRequestService,
  deliveryTrackingService
};
