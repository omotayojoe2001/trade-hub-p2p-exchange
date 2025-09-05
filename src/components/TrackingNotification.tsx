import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Clock, ArrowRight, X } from 'lucide-react';

interface ActiveTrade {
  id: string;
  coin_type: string;
  amount: number;
  naira_amount: number;
  status: string;
  trade_type: string;
  expires_at: string | null;
}

const TrackingNotification = () => {
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActiveTrades = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: trades } = await supabase
        .from('trades')
        .select('*')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .in('status', ['pending', 'in_progress', 'payment_pending'])
        .order('created_at', { ascending: false });

      if (trades && trades.length > 0) {
        const mappedTrades: ActiveTrade[] = trades.map(trade => ({
          id: trade.id,
          coin_type: trade.coin_type,
          amount: Number(trade.amount),
          naira_amount: Number(trade.naira_amount),
          status: trade.status,
          trade_type: trade.trade_type,
          expires_at: trade.expires_at || new Date(Date.now() + 3600000).toISOString()
        }));
        setActiveTrades(mappedTrades);
      }
      setLoading(false);
    };

    fetchActiveTrades();

    // Set up real-time subscription
    const channel = supabase
      .channel('trade-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'trades' }, 
        () => {
          fetchActiveTrades();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleGoToTrades = () => {
    navigate('/my-trades');
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (loading || dismissed || activeTrades.length === 0) {
    return null;
  }

  const trade = activeTrades[0];
  const isExpiring = trade.expires_at && new Date(trade.expires_at) < new Date(Date.now() + 30 * 60 * 1000);

  return (
    <Card className="mx-4 mt-4 border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <p className="text-orange-800 font-medium text-sm">
                {activeTrades.length} active trade{activeTrades.length > 1 ? 's' : ''} in progress
              </p>
              <p className="text-orange-600 text-xs">
                {trade.trade_type === 'buy' ? 'Buying' : 'Selling'} {trade.amount} {trade.coin_type}
                {isExpiring && (
                  <span className="ml-2 inline-flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Expires soon
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoToTrades}
              className="text-orange-700 border-orange-300 hover:bg-orange-100"
            >
              Track
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-orange-600 hover:text-orange-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrackingNotification;