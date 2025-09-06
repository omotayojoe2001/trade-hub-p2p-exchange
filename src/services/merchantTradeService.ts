import { supabase } from '@/integrations/supabase/client';
import { tradeRequestService } from './tradeRequestService';

export interface MerchantTradeRequest {
  id: string;
  requester_id: string;
  merchant_id: string;
  trade_type: 'buy' | 'sell';
  coin_type: 'BTC' | 'ETH' | 'USDT';
  amount: number;
  naira_amount: number;
  rate: number;
  payment_method: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  created_at: string;
  expires_at: string;
  requester_name?: string;
}

export const merchantTradeService = {
  // Send a trade request to a specific merchant
  async sendTradeRequestToMerchant(
    requesterId: string,
    merchantId: string,
    tradeData: {
      trade_type: 'buy' | 'sell';
      coin_type: 'BTC' | 'ETH' | 'USDT';
      amount: number;
      naira_amount: number;
      rate: number;
      payment_method: string;
    }
  ): Promise<MerchantTradeRequest> {
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes to respond

      // Create the trade request
      const { data: tradeRequest, error } = await supabase
        .from('trade_requests')
        .insert({
          user_id: requesterId,
          trade_type: tradeData.trade_type,
          crypto_type: tradeData.coin_type,
          amount_crypto: tradeData.amount,
          amount_fiat: tradeData.naira_amount,
          rate: tradeData.rate,
          payment_method: tradeData.payment_method,
          status: 'open',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating merchant trade request:', error);
        throw error;
      }

      // Create merchant notification record (for targeted requests)
      await supabase
        .from('merchant_notifications')
        .insert({
          trade_request_id: tradeRequest.id,
          merchant_id: merchantId
        });

      // Create notification for the specific merchant only
      await supabase
        .from('notifications')
        .insert({
          user_id: merchantId,
          type: 'trade_request',
          title: 'New Trade Request',
          message: `New ${tradeData.trade_type} request for ${tradeData.amount} ${tradeData.coin_type}`,
          data: { 
            trade_request_id: tradeRequest.id,
            requester_id: requesterId,
            amount: tradeData.amount,
            coin_type: tradeData.coin_type,
            trade_type: tradeData.trade_type
          }
        });

      return {
        id: tradeRequest.id,
        requester_id: requesterId,
        merchant_id: merchantId,
        trade_type: tradeData.trade_type,
        coin_type: tradeData.coin_type,
        amount: tradeData.amount,
        naira_amount: tradeData.naira_amount,
        rate: tradeData.rate,
        payment_method: tradeData.payment_method,
        status: 'pending',
        created_at: tradeRequest.created_at,
        expires_at: tradeRequest.expires_at
      };
    } catch (error) {
      console.error('Error in sendTradeRequestToMerchant:', error);
      throw error;
    }
  },

  // Get pending trade requests for a specific merchant only
  async getMerchantTradeRequests(merchantId: string): Promise<MerchantTradeRequest[]> {
    try {
      // Get trade requests specifically targeted to this merchant
      const { data: merchantNotifications, error: notifError } = await supabase
        .from('merchant_notifications')
        .select(`
          trade_request_id,
          created_at,
          trade_requests!inner(*)
        `)
        .eq('merchant_id', merchantId)
        .eq('trade_requests.status', 'open')
        .gt('trade_requests.expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (notifError) {
        console.error('Error fetching merchant trade requests:', notifError);
        throw notifError;
      }

      if (!merchantNotifications || merchantNotifications.length === 0) {
        return [];
      }

      // Transform the requests
      return merchantNotifications.map(mn => {
        const request = (mn as any).trade_requests;
        return {
          id: request.id,
          requester_id: request.user_id,
          merchant_id: merchantId,
          trade_type: request.trade_type as 'buy' | 'sell',
          coin_type: request.crypto_type as 'BTC' | 'ETH' | 'USDT',
          amount: request.amount_crypto,
          naira_amount: request.amount_fiat,
          rate: request.rate,
          payment_method: request.payment_method,
          status: 'pending',
          created_at: request.created_at,
          expires_at: request.expires_at,
          requester_name: 'Anonymous'
        };
      });
    } catch (error) {
      console.error('Error in getMerchantTradeRequests:', error);
      throw error;
    }
  },

  // Accept a trade request (merchant action) - Use escrow flow
  async acceptMerchantTradeRequest(tradeRequestId: string, merchantId: string): Promise<any> {
    try {
      // Import escrow service
      const { escrowTradeService } = await import('./escrowTradeService');
      return await escrowTradeService.acceptTradeRequestAndCreateEscrow(tradeRequestId, merchantId);
    } catch (error) {
      console.error('Error in acceptMerchantTradeRequest:', error);
      throw error;
    }
  },

  // Decline a trade request (merchant action)
  async declineMerchantTradeRequest(tradeRequestId: string, merchantId: string): Promise<void> {
    try {
      return await tradeRequestService.declineTradeRequest(tradeRequestId, merchantId);
    } catch (error) {
      console.error('Error in declineMerchantTradeRequest:', error);
      throw error;
    }
  },

  // Subscribe to merchant trade requests
  subscribeMerchantTradeRequests(merchantId: string, callback: (requests: MerchantTradeRequest[]) => void) {
    const channel = supabase
      .channel(`merchant-trade-requests-${merchantId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trade_requests'
      }, async () => {
        try {
          const requests = await this.getMerchantTradeRequests(merchantId);
          callback(requests);
        } catch (error) {
          console.error('Error refreshing merchant trade requests:', error);
        }
      })
      .subscribe();

    return channel;
  }
};