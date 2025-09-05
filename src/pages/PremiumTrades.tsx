import React, { useState, useEffect } from 'react';
import { Crown, Zap, Clock, DollarSign, TrendingUp, Filter, Search, Star, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const PremiumTrades = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrades();
  }, [user]);

  const loadTrades = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrades(data || []);
    } catch (error) {
      console.error('Error loading trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTradeClick = (trade: any) => {
    // Navigate based on trade status and type
    switch (trade.status) {
      case 'cash_delivery':
      case 'cash_pickup':
        // Show delivery/pickup status with tracking code
        navigate('/delivery-status', {
          state: {
            tradeId: trade.id,
            type: trade.status,
            code: trade.trackingCode || `${trade.status.toUpperCase()}-${trade.id}`,
            expectedDate: trade.expectedDate || new Date(Date.now() + 86400000).toISOString(),
            status: trade.deliveryStatus || 'pending',
            amount: trade.total,
            crypto: trade.crypto
          }
        });
        break;

      case 'bank_transfer_completed':
        // Show receipt download/share options
        navigate('/receipt-page', {
          state: {
            tradeId: trade.id,
            type: 'bank_transfer',
            amount: trade.total,
            crypto: trade.crypto,
            completedAt: trade.completedAt || new Date().toISOString(),
            bankDetails: trade.bankDetails
          }
        });
        break;

      case 'confirming_payment':
      case 'payment_pending':
        // Link to premium payment status
        navigate('/premium-payment-status', {
          state: {
            tradeId: trade.id,
            type: trade.type,
            cryptocurrency: trade.crypto,
            amount: trade.amount,
            step: 2 // Waiting for confirmation step
          }
        });
        break;

      case 'matched':
        // Show trade progress
        navigate('/trade-progress', {
          state: {
            tradeId: trade.id,
            type: trade.type,
            crypto: trade.crypto,
            amount: trade.amount,
            trader: trade.trader,
            status: trade.status
          }
        });
        break;

      default:
        // Default trade details
        navigate(`/trade-details/${trade.id}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredTrades = trades.filter(trade => {
    if (filter !== 'all' && trade.status !== filter) return false;
    if (searchTerm && !trade.crypto_type?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your trades...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <Briefcase size={24} className="mr-2 text-gray-600" />
              My Trades
            </h1>
            <p className="text-gray-600 text-sm">Your premium trading history</p>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Crown size={12} className="mr-1" />
            Premium
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Premium Stats */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Premium Trading Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{trades.length}</div>
              <div className="text-xs text-gray-600">Total Trades</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{trades.filter(t => t.status === 'completed').length}</div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{trades.filter(t => t.status === 'pending').length}</div>
              <div className="text-xs text-gray-600">Active</div>
            </div>
          </div>
        </Card>

        {/* Search and Filter */}
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search trades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trades</SelectItem>
              <SelectItem value="premium">Premium Only</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="active">Active</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Trades List */}
        <div className="space-y-3">
          {filteredTrades.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No trades found</h3>
              <p className="text-gray-500">
                {trades.length === 0
                  ? 'You haven\'t made any trades yet. Start trading to see your history here.'
                  : 'No trades match your current filter criteria.'
                }
              </p>
            </div>
          ) : (
            filteredTrades.map((trade) => (
              <Card
                key={trade.id}
                onClick={() => navigate(`/trade-details/${trade.id}`)}
                className="p-4 bg-white border-gray-200 hover:shadow-md transition-shadow cursor-pointer hover:border-gray-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      trade.trade_type === 'buy' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {trade.trade_type === 'buy' ?
                        <TrendingUp size={20} className="text-green-600" /> :
                        <DollarSign size={20} className="text-red-600" />
                      }
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900">
                          {trade.trade_type?.toUpperCase()} {trade.crypto_type}
                        </span>
                        <Crown size={14} className="text-yellow-500" />
                      </div>
                      <div className="text-sm text-gray-600">
                        {trade.amount_crypto} {trade.crypto_type} • ₦{trade.amount_fiat?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
                    {trade.status?.replace('_', ' ').toUpperCase()}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm">
                      <span className="text-gray-500">
                        {trade.seller_id === user?.id ? 'Buyer: ' : 'Seller: '}
                      </span>
                      <span className="font-medium">
                        Anonymous Trader
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {new Date(trade.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                  <div className="text-xs text-yellow-700 flex items-center">
                    <Crown size={12} className="mr-1 text-yellow-600" />
                    Premium Trade - Enhanced features and priority support
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => navigate('/premium-trade')}
            className="h-12 bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Zap size={16} className="mr-2" />
            New Premium Trade
          </Button>
          <Button variant="outline" className="h-12">
            <Filter size={16} className="mr-2" />
            Advanced Filters
          </Button>
        </div>


      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumTrades;
