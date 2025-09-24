import React, { useState, useEffect } from 'react';
import { ChevronRight, AlertCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuickAuth } from '@/hooks/useQuickAuth';
import BottomNavigation from '@/components/BottomNavigation';
import { toast } from '@/hooks/use-toast';

interface Trade {
  id: string;
  amount: number;
  crypto_type: string;
  status: string;
  created_at: string;
  buyer_id: string;
  seller_id: string;
  coin_type: string;
  trade_type: string;
  rate: number;
  naira_amount: number;
  amount_crypto: number;
  payment_proof_url?: string;
  completed_at?: string;
}

const MyTrades = () => {
  const { user } = useAuth();
  const { isQuickAuthActive } = useQuickAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  const fetchTrades = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching trades:', error);
        toast({
          title: "Error",
          description: "Failed to fetch trades",
          variant: "destructive"
        });
        return;
      }

      console.log('Fetched trades:', data);
      setTrades(data || []);
    } catch (error) {
      console.error('Error in fetchTrades:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, [user]);

  const getTradeStatus = (trade: Trade) => {
    if (!trade) return { text: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-100' };
    
    switch (trade.status) {
      case 'pending':
        return { 
          text: 'Pending', 
          color: 'text-yellow-700', 
          bgColor: 'bg-yellow-100' 
        };
      case 'completed':
        return { 
          text: 'Completed', 
          color: 'text-green-700', 
          bgColor: 'bg-green-100' 
        };
      case 'cancelled':
        return { 
          text: 'Cancelled', 
          color: 'text-red-700', 
          bgColor: 'bg-red-100' 
        };
      default:
        return { 
          text: trade.status || 'Unknown', 
          color: 'text-gray-700', 
          bgColor: 'bg-gray-100' 
        };
    }
  };

  const handleCompleteTrade = async (tradeId: string) => {
    try {
      const { error } = await supabase
        .from('trades')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', tradeId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Trade marked as completed",
      });

      fetchTrades();
    } catch (error) {
      console.error('Error completing trade:', error);
      toast({
        title: "Error",
        description: "Failed to complete trade",
        variant: "destructive"
      });
    }
  };

  const filterTrades = (trades: Trade[]) => {
    if (activeTab === 'All') return trades;
    
    const statusMap = {
      'Ongoing': ['pending', 'in_progress', 'payment_proof_uploaded'],
      'Completed': ['completed'],
      'Cancelled': ['cancelled'],
      'Disputes': ['disputed', 'under_review'],
      'Escrow': ['escrow_pending', 'escrow_funded']
    };
    
    return trades.filter(trade => {
      const statuses = statusMap[activeTab as keyof typeof statusMap] || [];
      return statuses.includes(trade.status);
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    if (currency === 'NGN') {
      return `NGN ${amount.toLocaleString()}`;
    }
    return `${amount} ${currency}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trades...</p>
        </div>
      </div>
    );
  }

  const filteredTrades = filterTrades(trades);

  return (
    <div className="min-h-screen bg-background font-['Poppins']">
      <div className="px-4 pt-6 pb-20 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">My Trades</h1>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6">
          {['All', 'Ongoing', 'Completed', 'Cancelled', 'Disputes', 'Escrow'].map((status) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`py-1.5 px-3 text-xs font-medium rounded-full transition-all duration-200 ${
                activeTab === status
                  ? 'bg-primary text-primary-foreground shadow-md scale-105'
                  : 'bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {filteredTrades.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trades found</h3>
            <p className="text-gray-500">
              {activeTab === 'All' 
                ? "You haven't made any trades yet." 
                : `No ${activeTab.toLowerCase()} trades found.`
              }
            </p>
            <Link 
              to="/buy-sell" 
              className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start Trading
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrades.map((trade) => {
              const status = getTradeStatus(trade);
              const userRole = (trade as any).buyer_id === user?.id ? 'buyer' : 'seller';
              const shouldShowComplete = trade.status === 'pending' && (trade as any).payment_proof_url;

              return (
                <div key={trade.id} className="bg-card rounded-lg border border-border p-3 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-medium text-xs">
                          {(trade.crypto_type || trade.coin_type || 'BTC').slice(0, 3)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-1">
                          <span className="font-medium text-sm text-foreground">
                            {userRole === 'buyer' ? 'Buy' : 'Sell'} {trade.crypto_type || trade.coin_type}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(trade.created_at)}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Amount</div>
                      <div className="font-medium text-xs text-foreground">
                        {(trade as any).amount_crypto || trade.amount} {trade.crypto_type || trade.coin_type}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Value</div>
                      <div className="font-medium text-xs text-foreground">
                        {formatAmount((trade as any).naira_amount || trade.amount, 'NGN')}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Rate</div>
                      <div className="font-medium text-xs text-foreground">
                        NGN {(trade as any).rate?.toLocaleString() || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Link
                      to={`/trade-details/${trade.id}`}
                      className="flex-1 py-1.5 px-3 bg-secondary text-secondary-foreground rounded-md text-xs font-medium hover:bg-secondary/80 transition-colors text-center"
                    >
                      View Details
                    </Link>
                    
                    {shouldShowComplete && (
                      <button
                        onClick={() => handleCompleteTrade(trade.id)}
                        className="px-3 py-1.5 bg-success text-success-foreground rounded-md text-xs font-medium hover:bg-success/90 transition-colors"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!isQuickAuthActive && <BottomNavigation />}
    </div>
  );
};

export default MyTrades;