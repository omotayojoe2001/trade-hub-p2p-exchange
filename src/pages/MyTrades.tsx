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
      'Ongoing': ['pending', 'in_progress'],
      'Completed': ['completed'],
      'Cancelled': ['cancelled', 'disputed']
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
      return `₦${amount.toLocaleString()}`;
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
    <div className="min-h-screen bg-white font-['Poppins']">
      <div className="px-4 pt-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Trades</h1>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {['All', 'Ongoing', 'Completed', 'Cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                activeTab === status
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
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
          <div className="space-y-4">
            {filteredTrades.map((trade) => {
              const status = getTradeStatus(trade);
              const userRole = trade.buyer_id === user?.id ? 'buyer' : 'seller';
              const shouldShowComplete = trade.status === 'pending' && trade.payment_proof_url;

              return (
                <div key={trade.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {trade.crypto_type || trade.coin_type}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900">
                            {userRole === 'buyer' ? 'Buy' : 'Sell'} {trade.crypto_type || trade.coin_type}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {formatDate(trade.created_at)}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Amount</div>
                      <div className="font-semibold text-gray-900">
                        {trade.amount_crypto || trade.amount} {trade.crypto_type || trade.coin_type}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Value</div>
                      <div className="font-semibold text-gray-900">
                        {formatAmount(trade.naira_amount || trade.amount, 'NGN')}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Rate</div>
                      <div className="font-semibold text-gray-900">
                        ₦{trade.rate?.toLocaleString() || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Trade ID</div>
                      <div className="font-mono text-xs text-gray-600">
                        {trade.id.slice(-8)}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Link
                      to={`/trade-details/${trade.id}`}
                      className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-center"
                    >
                      View Details
                    </Link>
                    
                    {shouldShowComplete && (
                      <button
                        onClick={() => handleCompleteTrade(trade.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Complete Trade
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