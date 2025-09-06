import { supabase } from '@/integrations/supabase/client';
import { escrowService } from './escrowService';

export interface TradeRequest {
  id: string;
  user_id: string;
  trade_type: 'buy' | 'sell';
  coin_type: 'BTC' | 'ETH' | 'USDT';
  amount: number;
  naira_amount: number;
  rate: number;
  payment_method: string;
  status: 'open' | 'accepted' | 'completed' | 'cancelled';
  expires_at: string;
  created_at: string;
  notes?: string;
  // Joined data
  merchant_name?: string;
  merchant_rating?: number;
  merchant_trade_count?: number;
}

export interface CreateTradeRequestData {
  trade_type: 'buy' | 'sell';
  coin_type: 'BTC' | 'ETH' | 'USDT';
  amount: number;
  naira_amount: number;
  rate: number;
  payment_method: string;
  notes?: string;
}

export const tradeRequestService = {
  // Create a new trade request
  async createTradeRequest(userId: string, data: CreateTradeRequestData): Promise<TradeRequest> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Expire in 24 hours

      const { data: tradeRequest, error } = await supabase
        .from('trade_requests')
        .insert({
          user_id: userId,
          trade_type: data.trade_type,
          crypto_type: data.coin_type,
          amount_crypto: data.amount,
          amount_fiat: data.naira_amount,
          rate: data.rate,
          payment_method: data.payment_method,
          status: 'open',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating trade request:', error);
        throw error;
      }

      return {
        id: tradeRequest.id,
        user_id: tradeRequest.user_id,
        trade_type: tradeRequest.trade_type as 'buy' | 'sell',
        coin_type: tradeRequest.crypto_type as 'BTC' | 'ETH' | 'USDT',
        amount: tradeRequest.amount_crypto,
        naira_amount: tradeRequest.amount_fiat,
        rate: tradeRequest.rate,
        payment_method: tradeRequest.payment_method,
        status: tradeRequest.status as 'open' | 'accepted' | 'completed' | 'cancelled',
        expires_at: tradeRequest.expires_at,
        created_at: tradeRequest.created_at
      };
    } catch (error) {
      console.error('Error in createTradeRequest:', error);
      throw error;
    }
  },

  // Get all open trade requests
  async getOpenTradeRequests(): Promise<TradeRequest[]> {
    try {
      const { data: tradeRequests, error } = await supabase
        .from('trade_requests')
        .select('*')
        .eq('status', 'open')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching trade requests:', error);
        throw error;
      }

      // Transform the data to match expected format
      const transformedRequests: TradeRequest[] = (tradeRequests || []).map(request => ({
        id: request.id,
        user_id: request.user_id,
        trade_type: request.trade_type as 'buy' | 'sell',
        coin_type: request.crypto_type as 'BTC' | 'ETH' | 'USDT',
        amount: request.amount_crypto,
        naira_amount: request.amount_fiat,
        rate: request.rate,
        payment_method: request.payment_method,
        status: request.status as 'open' | 'accepted' | 'completed' | 'cancelled',
        expires_at: request.expires_at,
        created_at: request.created_at,
        merchant_name: 'Unknown',
        merchant_rating: 5.0,
        merchant_trade_count: 0
      }));

      return transformedRequests;
    } catch (error) {
      console.error('Error in getOpenTradeRequests:', error);
      throw error;
    }
  },

  // Get trade requests for a specific user
  async getUserTradeRequests(userId: string): Promise<TradeRequest[]> {
    try {
      const { data: tradeRequests, error } = await supabase
        .from('trade_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user trade requests:', error);
        throw error;
      }

      return (tradeRequests || []).map(request => ({
        id: request.id,
        user_id: request.user_id,
        trade_type: request.trade_type as 'buy' | 'sell',
        coin_type: request.crypto_type as 'BTC' | 'ETH' | 'USDT',
        amount: request.amount_crypto,
        naira_amount: request.amount_fiat,
        rate: request.rate,
        payment_method: request.payment_method,
        status: request.status as 'open' | 'accepted' | 'completed' | 'cancelled',
        expires_at: request.expires_at,
        created_at: request.created_at
      }));
    } catch (error) {
      console.error('Error in getUserTradeRequests:', error);
      throw error;
    }
  },

  // Accept a trade request
  async acceptTradeRequest(tradeRequestId: string, acceptingUserId: string): Promise<any> {
    try {
      // First, get the trade request details
      const { data: tradeRequest, error: fetchError } = await supabase
        .from('trade_requests')
        .select('*')
        .eq('id', tradeRequestId)
        .single();

      if (fetchError) {
        console.error('Error fetching trade request:', fetchError);
        throw fetchError;
      }

      if (!tradeRequest) {
        throw new Error('Trade request not found');
      }

      if (tradeRequest.status !== 'open') {
        throw new Error('Trade request is no longer available');
      }

      // Update the trade request status
      const { error: updateError } = await supabase
        .from('trade_requests')
        .update({ status: 'accepted' })
        .eq('id', tradeRequestId);

      if (updateError) {
        console.error('Error updating trade request:', updateError);
        throw updateError;
      }

      // Create a new trade record
      const { data: trade, error: tradeError } = await supabase
        .from('trades')
        .insert({
          trade_request_id: tradeRequestId,
          buyer_id: tradeRequest.trade_type === 'sell' ? acceptingUserId : tradeRequest.user_id,
          seller_id: tradeRequest.trade_type === 'sell' ? tradeRequest.user_id : acceptingUserId,
          coin_type: tradeRequest.crypto_type,
          amount: tradeRequest.amount_crypto,
          naira_amount: tradeRequest.amount_fiat,
          rate: tradeRequest.rate,
          trade_type: tradeRequest.trade_type,
          payment_method: tradeRequest.payment_method,
          status: 'pending',
          escrow_status: 'pending'
        })
        .select()
        .single();

      if (tradeError) {
        console.error('Error creating trade:', tradeError);
        throw tradeError;
      }

      // Create escrow transaction for proper crypto handling
      try {
        await escrowService.createEscrow(trade.id, {
          crypto_sender_id: trade.seller_id, // Seller sends crypto
          crypto_receiver_id: trade.buyer_id, // Buyer receives crypto
          cash_sender_id: trade.buyer_id, // Buyer sends cash
          cash_receiver_id: trade.seller_id, // Seller receives cash
          crypto_type: trade.coin_type as 'BTC' | 'ETH' | 'USDT',
          crypto_amount: trade.amount,
          cash_amount: trade.naira_amount
        });

        console.log('Escrow created for trade:', trade.id);
      } catch (escrowError) {
        console.error('Error creating escrow:', escrowError);
        // Don't fail the trade creation if escrow fails
      }

      // Create notification for the original requester
      await supabase
        .from('notifications')
        .insert({
          user_id: tradeRequest.user_id,
          type: 'trade_update',
          title: 'Trade Request Accepted!',
          message: `Your ${tradeRequest.trade_type} request for ${tradeRequest.amount_crypto} ${tradeRequest.crypto_type} has been accepted`,
          data: { trade_id: trade.id, trade_request_id: tradeRequestId }
        });

      return trade;
    } catch (error) {
      console.error('Error in acceptTradeRequest:', error);
      throw error;
    }
  },

  // Cancel a trade request
  async cancelTradeRequest(tradeRequestId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('trade_requests')
        .update({ status: 'cancelled' })
        .eq('id', tradeRequestId)
        .eq('user_id', userId); // Ensure only the creator can cancel

      if (error) {
        console.error('Error cancelling trade request:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in cancelTradeRequest:', error);
      throw error;
    }
  },

  // Decline a trade request (for merchants)
  async declineTradeRequest(tradeRequestId: string, merchantId: string): Promise<void> {
    try {
      // First check if the trade request exists and is open
      const { data: tradeRequest, error: fetchError } = await supabase
        .from('trade_requests')
        .select('*')
        .eq('id', tradeRequestId)
        .single();

      if (fetchError) {
        console.error('Error fetching trade request:', fetchError);
        throw fetchError;
      }

      if (!tradeRequest) {
        throw new Error('Trade request not found');
      }

      if (tradeRequest.status !== 'open') {
        throw new Error('Trade request is no longer available');
      }

      // Update status to declined
      const { error } = await supabase
        .from('trade_requests')
        .update({
          status: 'cancelled'
        })
        .eq('id', tradeRequestId);

      if (error) {
        console.error('Error declining trade request:', error);
        throw error;
      }

      // Create notification for the original requester
      await supabase
        .from('notifications')
        .insert({
          user_id: tradeRequest.user_id,
          type: 'trade_update',
          title: 'Trade Request Declined',
          message: `Your ${tradeRequest.trade_type} request for ${tradeRequest.amount_crypto} ${tradeRequest.crypto_type} was declined`,
          data: { trade_request_id: tradeRequestId }
        });

    } catch (error) {
      console.error('Error in declineTradeRequest:', error);
      throw error;
    }
  },

  // Subscribe to real-time trade request updates
  subscribeToTradeRequests(callback: (tradeRequests: TradeRequest[]) => void) {
    const channel = supabase
      .channel('trade-requests-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trade_requests'
      }, async () => {
        // Refresh trade requests when any change occurs
        try {
          const tradeRequests = await this.getOpenTradeRequests();
          callback(tradeRequests);
        } catch (error) {
          console.error('Error refreshing trade requests in subscription:', error);
        }
      })
      .subscribe();

    return channel;
  },

  // Subscribe to trade request updates for a specific user
  subscribeToUserTradeRequests(userId: string, callback: (tradeRequests: TradeRequest[]) => void) {
    const channel = supabase
      .channel(`user-trade-requests-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trade_requests',
        filter: `user_id=eq.${userId}`
      }, async () => {
        // Refresh user's trade requests when any change occurs
        try {
          const tradeRequests = await this.getUserTradeRequests(userId);
          callback(tradeRequests);
        } catch (error) {
          console.error('Error refreshing user trade requests in subscription:', error);
        }
      })
      .subscribe();

    return channel;
  },

  // Get trade request by ID
  async getTradeRequestById(id: string): Promise<TradeRequest | null> {
    try {
      const { data: tradeRequest, error } = await supabase
        .from('trade_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching trade request:', error);
        return null;
      }

      return {
        id: tradeRequest.id,
        user_id: tradeRequest.user_id,
        trade_type: tradeRequest.trade_type as 'buy' | 'sell',
        coin_type: tradeRequest.crypto_type as 'BTC' | 'ETH' | 'USDT',
        amount: tradeRequest.amount_crypto,
        naira_amount: tradeRequest.amount_fiat,
        rate: tradeRequest.rate,
        payment_method: tradeRequest.payment_method,
        status: tradeRequest.status as 'open' | 'accepted' | 'completed' | 'cancelled',
        expires_at: tradeRequest.expires_at,
        created_at: tradeRequest.created_at,
        merchant_name: 'Unknown',
        merchant_rating: 5.0,
        merchant_trade_count: 0
      };
    } catch (error) {
      console.error('Error in getTradeRequestById:', error);
      return null;
    }
  }
};