import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface TradeRequest {
  id: string;
  user_id: string;
  trade_type: string;
  coin_type: string;
  amount: number;
  naira_amount: number;
  rate: number;
  payment_method: string;
  status: string;
  expires_at: string;
  notes?: string;
  matched_user_id?: string;
  created_at: string;
  display_name?: string;
  user_type?: string;
}

interface Trade {
  id: string;
  buyer_id: string;
  seller_id: string;
  trade_type: string;
  coin_type: string;
  amount: number;
  naira_amount: number;
  rate: number;
  payment_method: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useRealTimeTrading = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tradeRequests, setTradeRequests] = useState<TradeRequest[]>([]);
  const [userTrades, setUserTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial trade requests
  const loadTradeRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('trade_requests')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTradeRequests(data || []);
    } catch (error) {
      console.error('Error loading trade requests:', error);
    }
  }, []);

  // Load user's trades
  const loadUserTrades = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserTrades(data || []);
    } catch (error) {
      console.error('Error loading user trades:', error);
    }
  }, [user]);

  // Create trade request
  const createTradeRequest = useCallback(async (requestData: {
    trade_type: 'buy' | 'sell';
    coin_type: string;
    amount: number;
    naira_amount: number;
    rate: number;
    payment_method: string;
    notes?: string;
  }) => {
    if (!user) return null;

    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

      const { data, error } = await supabase
        .from('trade_requests')
        .insert({
          user_id: user.id,
          ...requestData,
          status: 'open',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Trade Request Created",
        description: `Your ${requestData.trade_type} request for ${requestData.amount} ${requestData.coin_type} has been posted.`,
      });

      return data;
    } catch (error) {
      console.error('Error creating trade request:', error);
      toast({
        title: "Error",
        description: "Failed to create trade request. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  }, [user, toast]);

  // Accept trade request
  const acceptTradeRequest = useCallback(async (requestId: string) => {
    if (!user) return null;

    try {
      // First, update the trade request
      const { data: updatedRequest, error: updateError } = await supabase
        .from('trade_requests')
        .update({
          status: 'matched',
          matched_user_id: user.id
        })
        .eq('id', requestId)
        .eq('status', 'open')
        .select()
        .single();

      if (updateError) throw updateError;

      if (!updatedRequest) {
        toast({
          title: "Trade Unavailable",
          description: "This trade request is no longer available.",
          variant: "destructive"
        });
        return null;
      }

      // Create the actual trade
      const tradeData = {
        buyer_id: updatedRequest.trade_type === 'buy' ? updatedRequest.user_id : user.id,
        seller_id: updatedRequest.trade_type === 'sell' ? updatedRequest.user_id : user.id,
        trade_type: updatedRequest.trade_type,
        coin_type: updatedRequest.coin_type,
        amount: updatedRequest.amount,
        naira_amount: updatedRequest.naira_amount,
        rate: updatedRequest.rate,
        payment_method: updatedRequest.payment_method,
        status: 'pending',
        notes: updatedRequest.notes
      };

      const { data: newTrade, error: tradeError } = await supabase
        .from('trades')
        .insert(tradeData)
        .select()
        .single();

      if (tradeError) throw tradeError;

      toast({
        title: "Trade Matched!",
        description: `You've successfully matched with a ${updatedRequest.trade_type} request. The trade has begun.`,
      });

      return newTrade;
    } catch (error) {
      console.error('Error accepting trade request:', error);
      toast({
        title: "Error",
        description: "Failed to accept trade request. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  }, [user, toast]);

  // Update trade status
  const updateTradeStatus = useCallback(async (tradeId: string, newStatus: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('trades')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(notes && { notes })
        })
        .eq('id', tradeId);

      if (error) throw error;

      // Create trade update record
      await supabase
        .from('trade_updates')
        .insert({
          trade_id: tradeId,
          updated_by: user?.id,
          new_status: newStatus,
          notes
        });

      toast({
        title: "Trade Updated",
        description: `Trade status updated to ${newStatus}.`,
      });

      return true;
    } catch (error) {
      console.error('Error updating trade status:', error);
      toast({
        title: "Error",
        description: "Failed to update trade status.",
        variant: "destructive"
      });
      return false;
    }
  }, [user, toast]);

  // Set up real-time subscriptions
  useEffect(() => {
    loadTradeRequests();
    loadUserTrades();
    setLoading(false);

    // Subscribe to trade requests changes
    const tradeRequestsChannel = supabase
      .channel('trade_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trade_requests'
        },
        () => {
          loadTradeRequests();
        }
      )
      .subscribe();

    // Subscribe to trades changes for current user
    const tradesChannel = supabase
      .channel('trades_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades'
        },
        () => {
          loadUserTrades();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tradeRequestsChannel);
      supabase.removeChannel(tradesChannel);
    };
  }, [loadTradeRequests, loadUserTrades]);

  return {
    tradeRequests,
    userTrades,
    loading,
    createTradeRequest,
    acceptTradeRequest,
    updateTradeStatus,
    refreshData: () => {
      loadTradeRequests();
      loadUserTrades();
    }
  };
};