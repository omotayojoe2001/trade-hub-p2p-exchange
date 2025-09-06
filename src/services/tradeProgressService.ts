import { supabase } from '@/integrations/supabase/client';

export interface TradeProgress {
  id: string;
  user_id: string;
  trade_type: 'buy' | 'sell';
  coin_type: string;
  current_step: number;
  selected_merchant_id?: string;
  amount?: number;
  naira_amount?: number;
  merchant_rate?: number;
  selected_bank_account_id?: string;
  trade_data: any;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export const tradeProgressService = {
  // Save trade progress
  async saveTradeProgress(userId: string, progressData: Partial<TradeProgress>): Promise<TradeProgress> {
    try {
      // First, clean up any existing progress for the same trade type and coin
      await supabase
        .from('trade_progress')
        .delete()
        .eq('user_id', userId)
        .eq('trade_type', progressData.trade_type)
        .eq('coin_type', progressData.coin_type);

      const { data, error } = await supabase
        .from('trade_progress')
        .insert({
          user_id: userId,
          trade_type: progressData.trade_type,
          coin_type: progressData.coin_type,
          current_step: progressData.current_step || 1,
          selected_merchant_id: progressData.selected_merchant_id,
          amount: progressData.amount,
          naira_amount: progressData.naira_amount,
          merchant_rate: progressData.merchant_rate,
          selected_bank_account_id: progressData.selected_bank_account_id,
          trade_data: progressData.trade_data || {},
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        trade_type: data.trade_type as 'buy' | 'sell'
      };
    } catch (error) {
      console.error('Error saving trade progress:', error);
      throw error;
    }
  },

  // Get trade progress
  async getTradeProgress(userId: string, tradeType: 'buy' | 'sell', coinType: string): Promise<TradeProgress | null> {
    try {
      const { data, error } = await supabase
        .from('trade_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('trade_type', tradeType)
        .eq('coin_type', coinType)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? {
        ...data,
        trade_type: data.trade_type as 'buy' | 'sell'
      } : null;
    } catch (error) {
      console.error('Error getting trade progress:', error);
      return null;
    }
  },

  // Update trade progress
  async updateTradeProgress(progressId: string, updates: Partial<TradeProgress>): Promise<TradeProgress> {
    try {
      const { data, error } = await supabase
        .from('trade_progress')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', progressId)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        trade_type: data.trade_type as 'buy' | 'sell'
      };
    } catch (error) {
      console.error('Error updating trade progress:', error);
      throw error;
    }
  },

  // Clear trade progress
  async clearTradeProgress(progressId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('trade_progress')
        .delete()
        .eq('id', progressId);

      if (error) throw error;
    } catch (error) {
      console.error('Error clearing trade progress:', error);
      throw error;
    }
  },

  // Clean expired progress
  async cleanExpiredProgress(): Promise<void> {
    try {
      const { error } = await supabase
        .from('trade_progress')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) throw error;
    } catch (error) {
      console.error('Error cleaning expired progress:', error);
    }
  },

  // Get all user's active progress
  async getUserActiveProgress(userId: string): Promise<TradeProgress[]> {
    try {
      const { data, error } = await supabase
        .from('trade_progress')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        trade_type: item.trade_type as 'buy' | 'sell'
      }));
    } catch (error) {
      console.error('Error getting user active progress:', error);
      return [];
    }
  }
};
