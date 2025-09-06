import { supabase } from '@/integrations/supabase/client';

export interface IncompleteTradeData {
  id: string;
  type: 'trade_request' | 'trade' | 'payment';
  status: string;
  step: number;
  data: any;
  created_at: string;
  updated_at: string;
}

export const resumeTradeService = {
  // Check for incomplete trades when user logs in
  async checkIncompleteTradesForUser(userId: string): Promise<IncompleteTradeData[]> {
    try {
      const incompleteTrades: IncompleteTradeData[] = [];

      // Check for open trade requests
      const { data: tradeRequests, error: tradeRequestsError } = await supabase
        .from('trade_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'open');

      if (!tradeRequestsError && tradeRequests) {
        tradeRequests.forEach(request => {
          incompleteTrades.push({
            id: request.id,
            type: 'trade_request',
            status: request.status,
            step: 1, // Waiting for merchant response
            data: request,
            created_at: request.created_at,
            updated_at: request.created_at
          });
        });
      }

      // Check for incomplete trades (as buyer or seller)
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .in('status', ['pending', 'in_progress']);

      if (!tradesError && trades) {
        trades.forEach(trade => {
          let step = 1;
          if (trade.status === 'in_progress') step = 2;
          if (trade.escrow_status === 'crypto_received') step = 3;
          if (trade.escrow_status === 'cash_received') step = 4;

          incompleteTrades.push({
            id: trade.id,
            type: 'trade',
            status: trade.status,
            step: step,
            data: trade,
            created_at: trade.created_at,
            updated_at: trade.updated_at
          });
        });
      }

      return incompleteTrades.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

    } catch (error) {
      console.error('Error checking incomplete trades:', error);
      return [];
    }
  },

  // Get resume URL for a specific trade
  getResumeUrl(trade: IncompleteTradeData): string {
    switch (trade.type) {
      case 'trade_request':
        return `/my-trades`;
      case 'trade':
        return `/trade-details/${trade.id}`;
      default:
        return '/my-trades';
    }
  },

  // Get human-readable description of where user left off
  getResumeDescription(trade: IncompleteTradeData): string {
    switch (trade.type) {
      case 'trade_request':
        return `Waiting for merchant response on ${trade.data.coin_type} trade`;
      case 'trade':
        switch (trade.step) {
          case 1:
            return `Trade accepted - proceed to payment`;
          case 2:
            return `Payment pending - upload proof`;
          case 3:
            return `Waiting for payment confirmation`;
          case 4:
            return `Payment confirmed - waiting for completion`;
          default:
            return `Continue your trade`;
        }
      default:
        return 'Continue your transaction';
    }
  },

  // Mark trade as completed (remove from incomplete list)
  async markTradeCompleted(tradeId: string, type: 'trade_request' | 'trade') {
    try {
      if (type === 'trade_request') {
        await supabase
          .from('trade_requests')
          .update({ status: 'completed' })
          .eq('id', tradeId);
      } else {
        await supabase
          .from('trades')
          .update({ status: 'completed' })
          .eq('id', tradeId);
      }
    } catch (error) {
      console.error('Error marking trade as completed:', error);
    }
  }
};
