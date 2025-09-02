import React, { useState } from 'react';
import { Crown, Zap, Clock, DollarSign, TrendingUp, Filter, Search, Star, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const PremiumTrades = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  const trades = [
    {
      id: 'PT001',
      type: 'buy',
      crypto: 'BTC',
      amount: '0.05',
      price: '$97,234.50',
      total: '$4,861.73',
      status: 'confirming_payment',
      trader: 'John Doe',
      rating: 4.9,
      matchTime: '12 seconds',
      isPriority: true,
      description: 'Waiting for payment confirmation'
    },
    {
      id: 'PT002',
      type: 'sell',
      crypto: 'ETH',
      amount: '2.5',
      total: '$8,641.95',
      status: 'cash_delivery',
      trader: 'Sarah Wilson',
      rating: 5.0,
      deliveryTime: '45 minutes',
      isPriority: true,
      trackingCode: 'TD-2024-5678',
      expectedDate: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
      deliveryStatus: 'agent_assigned',
      description: 'Cash delivery in progress'
    },
    {
      id: 'PT003',
      type: 'sell',
      crypto: 'USDT',
      amount: '1000',
      total: '$1,000.00',
      status: 'bank_transfer_completed',
      trader: 'Mike Johnson',
      rating: 4.8,
      isPriority: true,
      completedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      bankDetails: {
        bankName: 'First Bank',
        accountNumber: '1234567890',
        accountName: 'John Smith'
      },
      description: 'Bank transfer completed - Download receipt'
    },
    {
      id: 'PT004',
      type: 'buy',
      crypto: 'BNB',
      amount: '10',
      price: '$695.00',
      total: '$6,950.00',
      status: 'completed',
      trader: 'Mike Chen',
      rating: 4.8,
      completedTime: '2 hours ago',
      isPriority: false,
      description: 'Trade completed successfully'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'priority_matched': return 'text-yellow-600 bg-yellow-100';
      case 'cash_delivery': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'priority_matched': return 'Priority Matched';
      case 'cash_delivery': return 'Cash Delivery';
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  const filteredTrades = trades.filter(trade => {
    const matchesSearch = trade.crypto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trade.trader.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trade.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filter === 'all' ||
                         (filter === 'premium' && trade.isPriority) ||
                         (filter === 'completed' && trade.status === 'completed') ||
                         (filter === 'active' && trade.status !== 'completed');

    return matchesSearch && matchesFilter;
  });

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
              <div className="text-2xl font-bold text-gray-900">15</div>
              <div className="text-xs text-gray-600">Premium Trades</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">8.5s</div>
              <div className="text-xs text-gray-600">Avg Match Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">100%</div>
              <div className="text-xs text-gray-600">Success Rate</div>
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
          {filteredTrades.map((trade) => (
            <Card
              key={trade.id}
              onClick={() => handleTradeClick(trade)}
              className="p-4 bg-white border-gray-200 hover:shadow-md transition-shadow cursor-pointer hover:border-gray-300"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    trade.type === 'buy' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {trade.type === 'buy' ? 
                      <TrendingUp size={20} className="text-green-600" /> :
                      <DollarSign size={20} className="text-red-600" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">
                        {trade.type.toUpperCase()} {trade.crypto}
                      </span>
                      {trade.isPriority && (
                        <Crown size={14} className="text-yellow-500" />
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {trade.amount} {trade.crypto} • {trade.total}
                    </div>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
                  {getStatusText(trade.status)}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <span className="text-gray-500">Trader: </span>
                    <span className="font-medium">{trade.trader}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star size={12} className="text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{trade.rating}</span>
                  </div>
                </div>
                <div className="text-right">
                  {trade.matchTime && (
                    <div className="text-xs text-yellow-600 flex items-center">
                      <Zap size={12} className="mr-1" />
                      Matched in {trade.matchTime}
                    </div>
                  )}
                  {trade.deliveryTime && (
                    <div className="text-xs text-blue-600 flex items-center">
                      <Clock size={12} className="mr-1" />
                      Delivery: {trade.deliveryTime}
                    </div>
                  )}
                  {trade.completedTime && (
                    <div className="text-xs text-gray-500">
                      {trade.completedTime}
                    </div>
                  )}
                </div>
              </div>

              {trade.isPriority && (
                <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-2">
                  <div className="text-xs text-gray-700 flex items-center">
                    <Crown size={12} className="mr-1 text-yellow-600" />
                    Premium Trade - Enhanced matching and support
                  </div>
                </div>
              )}
            </Card>
          ))}
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

        {/* Empty State */}
        {filteredTrades.length === 0 && (
          <div className="text-center py-12">
            <Briefcase size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trades found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'No trades match your current filter'}
            </p>
          </div>
        )}
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumTrades;
