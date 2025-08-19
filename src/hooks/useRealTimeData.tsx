import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Trade {
  id: string;
  buyer_id: string;
  seller_id: string;
  coin_type: string;
  amount: number;
  rate: number;
  status: string;
  created_at: string;
  updated_at: string;
  naira_amount?: number;
}

export const useRealTimeData = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Load user's trades
        const { data: tradesData } = await supabase
          .from('trades')
          .select('*')
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (tradesData) {
          const mappedTrades = tradesData.map(trade => ({
            id: trade.id,
            buyer_id: trade.buyer_id,
            seller_id: trade.seller_id || '',
            coin_type: trade.coin_type,
            amount: Number(trade.amount),
            rate: Number(trade.rate),
            status: trade.status,
            created_at: trade.created_at,
            updated_at: trade.updated_at,
            naira_amount: trade.naira_amount ? Number(trade.naira_amount) : undefined,
          }));
          setTrades(mappedTrades);
        }

      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscribe to trades
      const tradesChannel = supabase
        .channel('trades')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'trades',
          },
          (payload) => {
            const trade = payload.new as any;
            if (trade && (trade.buyer_id === user.id || trade.seller_id === user.id)) {
              if (payload.eventType === 'INSERT') {
                const mappedTrade: Trade = {
                  id: trade.id,
                  buyer_id: trade.buyer_id,
                  seller_id: trade.seller_id || '',
                  coin_type: trade.coin_type,
                  amount: Number(trade.amount),
                  rate: Number(trade.rate),
                  status: trade.status,
                  created_at: trade.created_at,
                  updated_at: trade.updated_at,
                  naira_amount: trade.naira_amount ? Number(trade.naira_amount) : undefined,
                };
                setTrades(prev => [mappedTrade, ...prev]);
                setUnreadCount(prev => prev + 1);
              } else if (payload.eventType === 'UPDATE') {
                const mappedTrade: Trade = {
                  id: trade.id,
                  buyer_id: trade.buyer_id,
                  seller_id: trade.seller_id || '',
                  coin_type: trade.coin_type,
                  amount: Number(trade.amount),
                  rate: Number(trade.rate),
                  status: trade.status,
                  created_at: trade.created_at,
                  updated_at: trade.updated_at,
                  naira_amount: trade.naira_amount ? Number(trade.naira_amount) : undefined,
                };
                setTrades(prev => 
                  prev.map(t => t.id === mappedTrade.id ? mappedTrade : t)
                );
                
                toast({
                  title: "Trade Update",
                  description: `Trade status updated to ${trade.status}`,
                });
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(tradesChannel);
      };
    };

    setupRealtime();
  }, [toast]);

  const markAsRead = async () => {
    setUnreadCount(0);
  };

  const createTrade = async (tradeData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.from('trades').insert({
        buyer_id: user.id,
        seller_id: tradeData.seller_id,
        coin_type: tradeData.coin_type,
        amount: tradeData.amount,
        rate: tradeData.rate,
        naira_amount: tradeData.naira_amount,
        status: 'pending',
        trade_type: tradeData.trade_type || 'buy',
        payment_method: tradeData.payment_method || 'bank_transfer',
        bank_account_details: tradeData.bank_account_details,
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Trade created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating trade:', error);
      toast({
        title: "Error",
        description: "Failed to create trade",
        variant: "destructive",
      });
    }
  };

  const updateTradeStatus = async (tradeId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('trades')
        .update({ status })
        .eq('id', tradeId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Trade status updated",
      });
    } catch (error) {
      console.error('Error updating trade status:', error);
      toast({
        title: "Error",
        description: "Failed to update trade status",
        variant: "destructive",
      });
    }
  };

  return {
    trades,
    unreadCount,
    markAsRead,
    createTrade,
    updateTradeStatus,
  };
};